export enum MemberOfferingType {
  Disciple = 'disciple',
  Preacher = 'preacher',
  Supervisor = 'supervisor',
  Copastor = 'copastor',
  Pastor = 'pastor',
  ExternalDonor = 'external-donor',
}

export const MemberOfferingTypeNames: Record<MemberOfferingType, string> = {
  [MemberOfferingType.Disciple]: 'Discípulo',
  [MemberOfferingType.Preacher]: 'Predicador',
  [MemberOfferingType.Supervisor]: 'Supervisor',
  [MemberOfferingType.Copastor]: 'Co-Pastor',
  [MemberOfferingType.Pastor]: 'Pastor',
  [MemberOfferingType.ExternalDonor]: 'Donador Externo',
};
