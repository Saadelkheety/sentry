import {EXAMPLE_TRANSACTION_TITLE, MockSpan} from 'sentry-test/performance/utils';
import {render, screen} from 'sentry-test/reactTestingLibrary';

import {IssueType} from 'sentry/types';

import {
  extractQueryParameters,
  SpanEvidenceKeyValueList,
} from './spanEvidenceKeyValueList';

describe('SpanEvidenceKeyValueList', () => {
  describe('N+1 Database Queries', () => {
    it('Renders relevant fields', () => {
      render(
        <SpanEvidenceKeyValueList
          issueType={IssueType.PERFORMANCE_N_PLUS_ONE_DB_QUERIES}
          transactionName={EXAMPLE_TRANSACTION_TITLE}
          parentSpan={
            new MockSpan({
              startTimestamp: 0,
              endTimestamp: 200,
              op: 'http.server',
            }).span
          }
          causeSpans={[]}
          offendingSpans={[
            new MockSpan({
              startTimestamp: 10,
              endTimestamp: 2100,
              op: 'db',
              description: 'SELECT * FROM books',
            }).span,
            new MockSpan({
              startTimestamp: 10,
              endTimestamp: 2100,
              op: 'db',
              description: 'SELECT * FROM books WHERE id = %s',
            }).span,
          ]}
        />
      );

      expect(screen.getByRole('cell', {name: 'Transaction'})).toBeInTheDocument();
      expect(
        screen.getByTestId('span-evidence-key-value-list.transaction')
      ).toHaveTextContent('/');

      expect(screen.getByRole('cell', {name: 'Parent Span'})).toBeInTheDocument();
      expect(
        screen.getByTestId('span-evidence-key-value-list.parent-span')
      ).toHaveTextContent('http.server');

      expect(screen.getByRole('cell', {name: 'Repeating Spans (2)'})).toBeInTheDocument();
      expect(
        screen.getByTestId(/span-evidence-key-value-list.repeating-spans/)
      ).toHaveTextContent('db - SELECT * FROM books');

      expect(screen.queryByRole('cell', {name: 'Parameter'})).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('span-evidence-key-value-list.problem-parameters')
      ).not.toBeInTheDocument();
    });
  });

  describe('Consecutive DB Queries', () => {
    it('Renders relevant fields', () => {
      render(
        <SpanEvidenceKeyValueList
          issueType={IssueType.PERFORMANCE_CONSECUTIVE_DB_QUERIES}
          transactionName="/"
          parentSpan={
            new MockSpan({
              startTimestamp: 0,
              endTimestamp: 650,
              op: 'http.server',
            }).span
          }
          causeSpans={[
            new MockSpan({
              startTimestamp: 10,
              endTimestamp: 200,
              op: 'db',
              description: 'SELECT * FROM USERS LIMIT 100',
            }).span,
          ]}
          offendingSpans={[
            new MockSpan({
              startTimestamp: 200,
              endTimestamp: 400,
              op: 'db',
              description: 'SELECT COUNT(*) FROM USERS',
            }).span,
          ]}
        />
      );

      expect(screen.getByRole('cell', {name: 'Transaction'})).toBeInTheDocument();
      expect(
        screen.getByTestId('span-evidence-key-value-list.transaction')
      ).toHaveTextContent('/');

      expect(screen.getByRole('cell', {name: 'Starting Span'})).toBeInTheDocument();
      expect(
        screen.getByTestId('span-evidence-key-value-list.starting-span')
      ).toHaveTextContent('db - SELECT * FROM USERS LIMIT 100');

      expect(
        screen.queryByRole('cell', {name: 'Parallelizable Span'})
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('span-evidence-key-value-list.parallelizable-span')
      ).toHaveTextContent('db - SELECT COUNT(*) FROM USERS');
    });
  });

  describe('N+1 API Calls', () => {
    it('Renders relevant fields', () => {
      render(
        <SpanEvidenceKeyValueList
          issueType={IssueType.PERFORMANCE_N_PLUS_ONE_API_CALLS}
          transactionName="/"
          parentSpan={
            new MockSpan({
              startTimestamp: 0,
              endTimestamp: 200,
              op: 'pageload',
            }).span
          }
          causeSpans={[]}
          offendingSpans={[
            new MockSpan({
              startTimestamp: 10,
              endTimestamp: 2100,
              op: 'http.client',
              description: 'GET http://service.api/book/?book_id=7&sort=up',
            }).span,
            new MockSpan({
              startTimestamp: 10,
              endTimestamp: 2100,
              op: 'http.client',
              description: 'GET http://service.api/book/?book_id=8&sort=down',
            }).span,
          ]}
        />
      );

      expect(screen.getByRole('cell', {name: 'Transaction'})).toBeInTheDocument();
      expect(
        screen.getByTestId('span-evidence-key-value-list.transaction')
      ).toHaveTextContent('/');

      expect(screen.getByRole('cell', {name: 'Repeating Spans (2)'})).toBeInTheDocument();
      expect(
        screen.getByTestId(/span-evidence-key-value-list.repeating-spans/)
      ).toHaveTextContent('/book/');

      expect(screen.queryByRole('cell', {name: 'Parameters'})).toBeInTheDocument();
      expect(
        screen.getByTestId('span-evidence-key-value-list.parameters')
      ).toHaveTextContent('book_id:{7,8} sort:{up,down}');
    });

    describe('extractQueryParameters', () => {
      it('If the URLs have no parameters or are malformed, returns nothing', () => {
        const URLs = [
          new URL('http://service.io/items'),
          new URL('http://service.io/values'),
        ];

        expect(extractQueryParameters(URLs)).toEqual({});
      });

      it('If the URLs have one changing parameter, returns it and its values', () => {
        const URLs = [
          new URL('http://service.io/items?id=4'),
          new URL('http://service.io/items?id=5'),
          new URL('http://service.io/items?id=6'),
        ];

        expect(extractQueryParameters(URLs)).toEqual({
          id: ['4', '5', '6'],
        });
      });

      it('If the URLs have multiple changing parameters, returns them and their values', () => {
        const URLs = [
          new URL('http://service.io/items?id=4&sort=down&filter=none'),
          new URL('http://service.io/items?id=5&sort=up&filter=none'),
          new URL('http://service.io/items?id=6&sort=up&filter=none'),
        ];

        expect(extractQueryParameters(URLs)).toEqual({
          id: ['4', '5', '6'],
          sort: ['down', 'up'],
          filter: ['none'],
        });
      });
    });
  });

  describe('Slow DB Span', () => {
    it('Renders relevant fields', () => {
      render(
        <SpanEvidenceKeyValueList
          issueType={IssueType.PERFORMANCE_SLOW_SPAN}
          transactionName="/"
          parentSpan={
            new MockSpan({
              startTimestamp: 0,
              endTimestamp: 200,
              op: 'pageload',
            }).span
          }
          causeSpans={[]}
          offendingSpans={[
            new MockSpan({
              startTimestamp: 10,
              endTimestamp: 10100,
              op: 'db',
              description: 'SELECT pokemon FROM pokedex',
            }).span,
          ]}
        />
      );

      expect(screen.getByRole('cell', {name: 'Transaction'})).toBeInTheDocument();
      expect(
        screen.getByTestId('span-evidence-key-value-list.transaction')
      ).toHaveTextContent('/');

      expect(screen.getByRole('cell', {name: 'Slow Span'})).toBeInTheDocument();
      expect(
        screen.getByTestId('span-evidence-key-value-list.slow-span')
      ).toHaveTextContent('SELECT pokemon FROM pokedex');
    });
  });
});
