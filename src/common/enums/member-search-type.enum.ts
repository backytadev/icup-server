export enum MemberSearchType {
  //* Church
  ChurchName = 'church_name',
  FoundingDate = 'founding_date',

  //* Ministry
  MinistryType = 'ministry_type',
  MinistryCustomName = 'custom_ministry_name',

  //* Location
  Department = 'department',
  Province = 'province',
  District = 'district',
  UrbanSector = 'urban_sector',
  Country = 'country',
  Address = 'address',
  OriginCountry = 'origin_country',

  //* Residence
  ResidenceCountry = 'residence_country',
  ResidenceDepartment = 'residence_department',
  ResidenceProvince = 'residence_province',
  ResidenceDistrict = 'residence_district',
  ResidenceUrbanSector = 'residence_urban_sector',
  ResidenceAddress = 'residence_address',

  //* Personal
  FirstNames = 'first_names',
  LastNames = 'last_names',
  FullNames = 'full_names',
  BirthDate = 'birth_date',
  BirthMonth = 'birth_month',
  Gender = 'gender',
  MaritalStatus = 'marital_status',

  //* Zone & Family Group
  ZoneName = 'zone_name',
  FamilyGroupCode = 'family_group_code',
  FamilyGroupName = 'family_group_name',
  MostPopulatedFamilyGroups = 'most_populated_family_groups',
  LessPopulatedFamilyGroups = 'less_populated_family_groups',

  //* Availability
  AvailablePreachersByZone = 'available_preachers_by_zone',
  AvailableSupervisorsByCopastor = 'available_supervisors_by_copastor',
  AvailableSupervisorsByChurch = 'available_supervisors_by_church',

  //* Status
  RecordStatus = 'record_status',
}

export const MemberSearchTypeNames: Record<MemberSearchType, string> = {
  [MemberSearchType.ChurchName]: 'Nombre de Iglesia',
  [MemberSearchType.FoundingDate]: 'Fecha de Fundación',

  [MemberSearchType.MinistryType]: 'Tipo de Ministerio',
  [MemberSearchType.MinistryCustomName]: 'Nombre Alias',

  [MemberSearchType.Department]: 'Departamento',
  [MemberSearchType.Province]: 'Provincia',
  [MemberSearchType.District]: 'Distrito',
  [MemberSearchType.UrbanSector]: 'Sector Urbano',
  [MemberSearchType.Country]: 'País',
  [MemberSearchType.Address]: 'Dirección',
  [MemberSearchType.OriginCountry]: 'País de Origen',

  [MemberSearchType.ResidenceCountry]: 'País (residencia)',
  [MemberSearchType.ResidenceDepartment]: 'Departamento (residencia)',
  [MemberSearchType.ResidenceProvince]: 'Provincia (residencia)',
  [MemberSearchType.ResidenceDistrict]: 'Distrito (residencia)',
  [MemberSearchType.ResidenceUrbanSector]: 'Sector Urbano (residencia)',
  [MemberSearchType.ResidenceAddress]: 'Dirección (residencia)',

  [MemberSearchType.FirstNames]: 'Nombres',
  [MemberSearchType.LastNames]: 'Apellidos',
  [MemberSearchType.FullNames]: 'Nombres Completos',
  [MemberSearchType.BirthDate]: 'Fecha de Nacimiento',
  [MemberSearchType.BirthMonth]: 'Mes de Nacimiento',
  [MemberSearchType.Gender]: 'Género',
  [MemberSearchType.MaritalStatus]: 'Estado Civil',

  [MemberSearchType.ZoneName]: 'Nombre de Zona',
  [MemberSearchType.FamilyGroupCode]: 'Código de Grupo Familiar',
  [MemberSearchType.FamilyGroupName]: 'Nombre de Grupo Familiar',
  [MemberSearchType.MostPopulatedFamilyGroups]:
    'Grupos Familiares más poblados',

  [MemberSearchType.LessPopulatedFamilyGroups]:
    'Grupos Familiares menos poblados',

  [MemberSearchType.AvailablePreachersByZone]:
    'Predicadores disponibles por Zona',
  [MemberSearchType.AvailableSupervisorsByCopastor]:
    'Supervisores disponibles por co-pastor',
  [MemberSearchType.AvailableSupervisorsByChurch]:
    'Supervisores disponibles por iglesia',

  [MemberSearchType.RecordStatus]: 'Estado de Registro',
};
