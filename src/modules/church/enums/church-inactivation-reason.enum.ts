export enum ChurchInactivationReason {
  //* Administrative reasons
  MergerWithAnotherChurch = 'merger_with_another_church',
  Relocation = 'relocation',
  TemporaryClosure = 'temporary_closure',
  DataReorganization = 'data_reorganization',

  //* Natural or unexpected reasons
  NaturalDisaster = 'natural_disaster',
  Pandemic = 'pandemic',
  InfrastructureLoss = 'infrastructure_loss',

  //* Reasons related to the community
  MembershipDecline = 'membership_decline',
  InternalConflicts = 'internal_conflicts',
  LeadershipVacancy = 'leadership_vacancy',

  //* Economic reasons
  FinancialInfeasibility = 'financial_infeasibility',
  LossOfSupport = 'loss_of_support',

  //* Razones legales o normativos
  LegalDisputes = 'legal_disputes',
  RegulatoryNonCompliance = 'regulatory_non_compliance',

  //* Legal or regulatory reasons
  MinistryRefocus = 'ministry_refocus',
  ConsolidationWithNearbyChurches = 'consolidation_with_nearby_churches',

  //* Reasons due to external factors
  CommunityRelocation = 'community_relocation',
  GovernmentMandatedClosure = 'government_mandated_closure',
}

export const ChurchInactivationReasonNames: Record<
  ChurchInactivationReason,
  string
> = {
  [ChurchInactivationReason.MergerWithAnotherChurch]:
    'Fusión con otra iglesia.',
  [ChurchInactivationReason.Relocation]: 'Cambio de ubicación.',
  [ChurchInactivationReason.TemporaryClosure]:
    'Cierre temporal por remodelación.',
  [ChurchInactivationReason.DataReorganization]: 'Reorganización de registros.',

  [ChurchInactivationReason.NaturalDisaster]: 'Desastres naturales.',
  [ChurchInactivationReason.Pandemic]: 'Pandemias o emergencias sanitarias.',
  [ChurchInactivationReason.InfrastructureLoss]: 'Pérdida de infraestructura.',

  [ChurchInactivationReason.MembershipDecline]:
    'Disminución significativa de miembros.',
  [ChurchInactivationReason.InternalConflicts]:
    'Conflictos internos graves entre líderes o miembros.',
  [ChurchInactivationReason.LeadershipVacancy]:
    'Falta de liderazgo, ausencia de pastores o líderes.',

  [ChurchInactivationReason.FinancialInfeasibility]:
    'Problemas financieros, imposibilidad de mantener gastos operativos.',
  [ChurchInactivationReason.LossOfSupport]:
    'Falta de apoyo externo para sustento de la iglesia.',

  [ChurchInactivationReason.LegalDisputes]:
    'Problemas legales, enfrentamiento de demandas.',
  [ChurchInactivationReason.RegulatoryNonCompliance]:
    'Incumplimiento de normativas legales, permisos, registros.',

  [ChurchInactivationReason.MinistryRefocus]:
    'Cambio de enfoque ministerial. / Redirección de recursos.',
  [ChurchInactivationReason.ConsolidationWithNearbyChurches]:
    'Concentración en iglesias cercanas.',

  [ChurchInactivationReason.CommunityRelocation]:
    'Reubicación de la comunidad a otra región.',
  [ChurchInactivationReason.GovernmentMandatedClosure]:
    'Clausura gubernamental por decisiones municipales o estatales',
};
