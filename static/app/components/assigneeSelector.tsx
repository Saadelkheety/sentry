import {Fragment} from 'react';
import styled from '@emotion/styled';

import {
  AssigneeSelectorDropdown,
  AssigneeSelectorDropdownProps,
  SuggestedAssignee,
} from 'sentry/components/assigneeSelectorDropdown';
import ActorAvatar from 'sentry/components/avatar/actorAvatar';
import SuggestedAvatarStack from 'sentry/components/avatar/suggestedAvatarStack';
import DropdownBubble from 'sentry/components/dropdownBubble';
import ExternalLink from 'sentry/components/links/externalLink';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import Tooltip from 'sentry/components/tooltip';
import {IconChevron, IconUser} from 'sentry/icons';
import {t, tct, tn} from 'sentry/locale';
import space from 'sentry/styles/space';
import type {Actor, SuggestedOwnerReason} from 'sentry/types';
import useOrganization from 'sentry/utils/useOrganization';

interface AssigneeSelectorProps
  extends Omit<AssigneeSelectorDropdownProps, 'children' | 'organization'> {
  noDropdown?: boolean;
}

function AssigneeSelector({noDropdown, ...props}: AssigneeSelectorProps) {
  const organization = useOrganization();

  function getActorElement(
    assignedTo?: Actor,
    suggestedActors: SuggestedAssignee[] = []
  ) {
    const suggestedReasons: Record<SuggestedOwnerReason, React.ReactNode> = {
      suspectCommit: tct('Based on [commit:commit data]', {
        commit: (
          <TooltipSubExternalLink href="https://docs.sentry.io/product/sentry-basics/integrate-frontend/configure-scms/" />
        ),
      }),
      releaseCommit: '',
      ownershipRule: t('Matching Issue Owners Rule'),
      codeowners: t('Matching Codeowners Rule'),
    };
    const assignedToSuggestion = suggestedActors.find(
      actor => actor.id === assignedTo?.id
    );

    return assignedTo ? (
      <ActorAvatar
        actor={assignedTo}
        className="avatar"
        size={24}
        tooltip={
          <TooltipWrapper>
            {tct('Assigned to [name]', {
              name: assignedTo.type === 'team' ? `#${assignedTo.name}` : assignedTo.name,
            })}
            {assignedToSuggestion &&
              suggestedReasons[assignedToSuggestion.suggestedReason] && (
                <TooltipSubtext>
                  {suggestedReasons[assignedToSuggestion.suggestedReason]}
                </TooltipSubtext>
              )}
          </TooltipWrapper>
        }
      />
    ) : suggestedActors && suggestedActors.length > 0 ? (
      <SuggestedAvatarStack
        size={28}
        owners={suggestedActors}
        tooltipOptions={{isHoverable: true}}
        tooltip={
          <TooltipWrapper>
            <div>
              {tct('Suggestion: [name]', {
                name:
                  suggestedActors[0].type === 'team'
                    ? `#${suggestedActors[0].name}`
                    : suggestedActors[0].name,
              })}
              {suggestedActors.length > 1 &&
                tn(' + %s other', ' + %s others', suggestedActors.length - 1)}
            </div>
            <TooltipSubtext>
              {suggestedReasons[suggestedActors[0].suggestedReason]}
            </TooltipSubtext>
          </TooltipWrapper>
        }
      />
    ) : (
      <Tooltip
        isHoverable
        skipWrapper
        title={
          <TooltipWrapper>
            <div>{t('Unassigned')}</div>
            <TooltipSubtext>
              {tct(
                'You can auto-assign issues by adding [issueOwners:Issue Owner rules].',
                {
                  issueOwners: (
                    <TooltipSubExternalLink href="https://docs.sentry.io/product/error-monitoring/issue-owners/" />
                  ),
                }
              )}
            </TooltipSubtext>
          </TooltipWrapper>
        }
      >
        <StyledIconUser data-test-id="unassigned" size="md" color="gray400" />
      </Tooltip>
    );
  }

  return (
    <AssigneeWrapper>
      <AssigneeSelectorDropdown organization={organization} {...props}>
        {({loading, isOpen, assignedTo, getActorProps, suggestedAssignees}) => {
          const avatarElement = getActorElement(assignedTo, suggestedAssignees);

          return (
            <Fragment>
              {loading && (
                <LoadingIndicator
                  mini
                  style={{height: '24px', margin: 0, marginRight: 11}}
                />
              )}
              {!loading && !noDropdown && (
                <DropdownButton data-test-id="assignee-selector" {...getActorProps({})}>
                  {avatarElement}
                  <StyledChevron direction={isOpen ? 'up' : 'down'} size="xs" />
                </DropdownButton>
              )}
              {!loading && noDropdown && avatarElement}
            </Fragment>
          );
        }}
      </AssigneeSelectorDropdown>
    </AssigneeWrapper>
  );
}

export default AssigneeSelector;

const AssigneeWrapper = styled('div')`
  display: flex;
  justify-content: flex-end;

  /* manually align menu underneath dropdown caret */
  ${DropdownBubble} {
    right: -14px;
  }
`;

const StyledIconUser = styled(IconUser)`
  /* We need this to center with Avatar */
  margin-right: 2px;
`;

const StyledChevron = styled(IconChevron)`
  margin-left: ${space(1)};
`;

const DropdownButton = styled('div')`
  display: flex;
  align-items: center;
  font-size: 20px;
`;

const TooltipWrapper = styled('div')`
  text-align: left;
`;

const TooltipSubtext = styled('div')`
  color: ${p => p.theme.subText};
`;

const TooltipSubExternalLink = styled(ExternalLink)`
  color: ${p => p.theme.subText};
  text-decoration: underline;

  :hover {
    color: ${p => p.theme.subText};
  }
`;
