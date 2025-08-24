export enum MinistryInactivationReason {
  //* Administrative reasons
  MergerWithAnotherMinistry = 'merger_with_another_ministry',
  Relocation = 'relocation',
  TemporaryClosure = 'temporary_closure',
  DataReorganization = 'data_reorganization',

  //* Reasons for lack of activity or commitment
  GeneralInactivity = 'general_inactivity',
  LackOfParticipation = 'lack_of_participation',
  LowDiscipleCommitment = 'low_disciple_commitment',

  //* Reasons related to the community
  MembershipDecline = 'membership_decline',
  InternalConflicts = 'internal_conflicts',
  LeadershipVacancy = 'leadership_vacancy',

  //* Reasons related to the leadership
  LeaderResignation = 'leader_resignation',
  LeadershipConflicts = 'leadership_conflicts',
  LeadershipIncapacity = 'leadership_incapacity',
}

export const MinistryInactivationReasonNames: Record<
  MinistryInactivationReason,
  string
> = {
  [MinistryInactivationReason.MergerWithAnotherMinistry]:
    'Fusión con otro ministerio.',
  [MinistryInactivationReason.Relocation]: 'Cambio de ubicación.',
  [MinistryInactivationReason.TemporaryClosure]:
    'Cierre temporal por remodelación.',
  [MinistryInactivationReason.DataReorganization]:
    'Reorganización de registros.',

  [MinistryInactivationReason.GeneralInactivity]:
    'Inactividad general el ministerio.',
  [MinistryInactivationReason.LackOfParticipation]:
    'Falta de participación en actividades o eventos.',
  [MinistryInactivationReason.LowDiscipleCommitment]:
    'Bajo compromiso de los discípulos asignados.',

  [MinistryInactivationReason.MembershipDecline]:
    'Disminución significativa de miembros.',
  [MinistryInactivationReason.InternalConflicts]:
    'Conflictos internos graves entre líderes o miembros.',
  [MinistryInactivationReason.LeadershipVacancy]:
    'Falta de liderazgo, ausencia de pastores o líderes.',

  [MinistryInactivationReason.LeaderResignation]:
    'Renuncia o inactividad prolongada del líder.',
  [MinistryInactivationReason.LeadershipConflicts]:
    'Conflictos graves entre el líder y los discípulos .',
  [MinistryInactivationReason.LeadershipIncapacity]:
    'Incapacidad del liderazgo para cumplir con las responsabilidades.',
};
