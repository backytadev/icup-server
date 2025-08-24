export enum MinistryInactivationCategory {
  Administrative = 'administrative',
  LackOfActivityOrCommitment = 'lack_of_activity_or_commitment',
  LeadershipIssues = 'leadership_issues',
  CommunityRelatedIssues = 'community_related_issues',
}

export const MinistryInactivationCategoryNames: Record<
  MinistryInactivationCategory,
  string
> = {
  [MinistryInactivationCategory.Administrative]: 'Razones Administrativas',
  [MinistryInactivationCategory.LackOfActivityOrCommitment]:
    'Razones por falta de actividad o compromiso',
  [MinistryInactivationCategory.LeadershipIssues]:
    'Razones por problemas de liderazgo',
  [MinistryInactivationCategory.CommunityRelatedIssues]:
    'Razones relacionados con la comunidad',
};
