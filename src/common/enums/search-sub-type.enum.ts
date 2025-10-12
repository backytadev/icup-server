export enum SearchSubType {
  //? Members
  //* Disciple
  DiscipleByPastorFirstNames = 'disciple_by_pastor_first_names',
  DiscipleByPastorLastNames = 'disciple_by_pastor_last_names',
  DiscipleByPastorFullNames = 'disciple_by_pastor_full_names',
  DiscipleByCopastorFirstNames = 'disciple_by_copastor_first_names',
  DiscipleByCopastorLastNames = 'disciple_by_copastor_last_names',
  DiscipleByCopastorFullNames = 'disciple_by_copastor_full_names',
  DiscipleBySupervisorFirstNames = 'disciple_by_supervisor_first_names',
  DiscipleBySupervisorLastNames = 'disciple_by_supervisor_last_names',
  DiscipleBySupervisorFullNames = 'disciple_by_supervisor_full_names',
  DiscipleByPreacherFirstNames = 'disciple_by_preacher_first_names',
  DiscipleByPreacherLastNames = 'disciple_by_preacher_last_names',
  DiscipleByPreacherFullNames = 'disciple_by_preacher_full_names',
  ByDiscipleFirstNames = 'by_disciple_first_names',
  ByDiscipleLastNames = 'by_disciple_last_names',
  ByDiscipleFullNames = 'by_disciple_full_names',

  //* Copastor
  CopastorByPastorFirstNames = 'copastor_by_pastor_first_names',
  CopastorByPastorLastNames = 'copastor_by_pastor_last_names',
  CopastorByPastorFullNames = 'copastor_by_pastor_full_names',
  ByCopastorFirtsNames = 'by_copastor_first_names',
  ByCopastorLastNames = 'by_copastor_last_names',
  ByCopastorFullNames = 'by_copastor_full_names',

  //* Supervisor
  SupervisorByPastorFirstNames = 'supervisor_by_pastor_first_names',
  SupervisorByPastorLastNames = 'supervisor_by_pastor_last_names',
  SupervisorByPastorFullNames = 'supervisor_by_pastor_full_names',
  SupervisorByCopastorFirstNames = 'supervisor_by_copastor_first_names',
  SupervisorByCopastorLastNames = 'supervisor_by_copastor_last_names',
  SupervisorByCopastorFullNames = 'supervisor_by_copastor_full_names',
  BySupervisorFirstNames = 'by_supervisor_first_names',
  BySupervisorLastNames = 'by_supervisor_last_names',
  BySupervisorFullNames = 'by_supervisor_full_names',

  //* Preacher
  PreacherByPastorFirstNames = 'preacher_by_pastor_first_names',
  PreacherByPastorLastNames = 'preacher_by_pastor_last_names',
  PreacherByPastorFullNames = 'preacher_by_pastor_full_names',
  PreacherByCopastorFirstNames = 'preacher_by_copastor_first_names',
  PreacherByCopastorLastNames = 'preacher_by_copastor_last_names',
  PreacherByCopastorFullNames = 'preacher_by_copastor_full_names',
  PreacherBySupervisorFirstNames = 'preacher_by_supervisor_first_names',
  PreacherBySupervisorLastNames = 'preacher_by_supervisor_last_names',
  PreacherBySupervisorFullNames = 'preacher_by_supervisor_full_names',
  ByPreacherFirstNames = 'by_preacher_first_names',
  ByPreacherLastNames = 'by_preacher_last_names',
  ByPreacherFullNames = 'by_preacher_full_names',

  //* Zone
  ZoneByPastorFirstNames = 'zone_by_pastor_first_names',
  ZoneByPastorLastNames = 'zone_by_pastor_last_names',
  ZoneByPastorFullNames = 'zone_by_pastor_full_names',
  ZoneByCopastorFirstNames = 'zone_by_copastor_first_names',
  ZoneByCopastorLastNames = 'zone_by_copastor_last_names',
  ZoneByCopastorFullNames = 'zone_by_copastor_full_names',
  ZoneBySupervisorFirstNames = 'zone_by_supervisor_first_names',
  ZoneBySupervisorLastNames = 'zone_by_supervisor_last_names',
  ZoneBySupervisorFullNames = 'zone_by_supervisor_full_names',

  //* Module Family Group
  FamilyGroupByPastorFirstNames = 'family_group_by_pastor_first_names',
  FamilyGroupByPastorLastNames = 'family_group_by_pastor_last_names',
  FamilyGroupByPastorFullNames = 'family_group_by_pastor_full_names',
  FamilyGroupByCopastorFirstNames = 'family_group_by_copastor_first_names',
  FamilyGroupByCopastorLastNames = 'family_group_by_copastor_last_names',
  FamilyGroupByCopastorFullNames = 'family_group_by_copastor_full_names',
  FamilyGroupBySupervisorFirstNames = 'family_group_by_supervisor_first_names',
  FamilyGroupBySupervisorLastNames = 'family_group_by_supervisor_last_names',
  FamilyGroupBySupervisorFullNames = 'family_group_by_supervisor_full_names',
  FamilyGroupByPreacherFirstNames = 'family_group_by_preacher_first_names',
  FamilyGroupByPreacherLastNames = 'family_group_by_preacher_last_names',
  FamilyGroupByPreacherFullNames = 'family_group_by_preacher_full_names',

  //? Ministry
  MinistryByPastorFirstNames = 'ministry_by_pastor_first_names',
  MinistryByPastorLastNames = 'ministry_by_pastor_last_names',
  MinistryByPastorFullNames = 'ministry_by_pastor_full_names',

  // ? Offering Income
  //* Family Group, Fasting Zonal, Fasting General, Vigil Zonal, vigilia General, Ground Church, Activities, Youngs
  OfferingByDate = 'offering_by_date',

  //* Sunday Service, youngs, school sunday
  OfferingByShift = 'offering_by_shift',
  OfferingByShiftDate = 'offering_by_shift_date',

  //* Family Group, Fasting Zonal, Vigil Zonal
  OfferingByZone = 'offering_by_zone',
  OfferingByZoneDate = 'offering_by_zone_date',

  //* Offering Family Group
  OfferingByGroupCode = 'offering_by_group_code',
  OfferingByGroupCodeDate = 'offering_by_group_code_date',
  OfferingByPreacherFirstNames = 'offering_by_preacher_first_names',
  OfferingByPreacherLastNames = 'offering_by_preacher_last_names',
  OfferingByPreacherFullNames = 'offering_by_preacher_full_names',

  //* Offering Ayuno y Vigilia Zonal
  OfferingBySupervisorFirstNames = 'offering_by_supervisor_first_names',
  OfferingBySupervisorLastNames = 'offering_by_supervisor_last_names',
  OfferingBySupervisorFullNames = 'offering_by_supervisor_full_names',

  //* Offering Ground Church and Special
  OfferingByContributorFirstNames = 'offering_by_contributor_first_names',
  OfferingByContributorLastNames = 'offering_by_contributor_last_names',
  OfferingByContributorFullNames = 'offering_by_contributor_full_names',

  // ? Offering Expenses
  //* Operative Expenses
  VenueRental = 'venue_rental',
  PublicServices = 'public_services',
  TransportationAndTravelAllowance = 'transportation_and_travel_allowance',
  InsuranceAndTaxes = 'insurance_and_taxes',
  SecurityAndSurveillance = 'security_and_surveillance',
  OtherAdministrativeExpenses = 'other_administrative_expenses',

  //* Maintenance and Repair Expenses
  PlumbingServices = 'plumbing_services',
  ElectricalServices = 'electrical_services',
  PaintingAndTouchUpsServices = 'painting_and_touch_ups_services',
  CleaningServices = 'cleaning_services',
  HeatingAndACSystemMaintenance = 'heating_and_ac_system_maintenance',
  SoundAndLightingEquipmentMaintenance = 'sound_and_lighting_equipment_maintenance',
  SoundAndLightingEquipmentRepairs = 'sound_and_lighting_equipment_repairs',
  GardenAndExteriorMaintenance = 'garden_and_exterior_maintenance',
  GeneralEquipmentRepairs = 'general_equipment_repairs',
  GeneralEquipmentMaintenance = 'general_equipment_maintenance',
  FurnitureRepairAndMaintenance = 'furniture_repair_and_maintenance',
  ComputerEquipmentRepairAndMaintenance = 'computer_equipment_repair_and_maintenance',
  RoofAndStructuralRepairs = 'roof_and_structural_repairs',
  DoorAndWindowRepairs = 'door_and_window_repairs',

  //* Decoration Expenses
  PurchaseFlowersAndPlants = 'purchase_flowers_and_plants',
  PurchaseDecorativeFurniture = 'purchase_decorative_furniture',
  PurchaseDecorativeItems = 'purchase_decorative_items',
  DecorationServices = 'decoration_services',
  LightingAndIlluminationServices = 'lighting_and_illumination_services',
  StageSetupServices = 'stage_setup_services',
  EventDecorationRentals = 'event_decoration_rentals',
  CleaningPostEventServices = 'cleaning_post_event_services',

  //* Equipment and Technology Expenses
  SoundEquipment = 'sound_equipment',
  ProjectionEquipment = 'projection_equipment',
  HvacEquipment = 'hvac_equipment',
  LightingEquipment = 'lighting_equipment',
  SecurityEquipment = 'security_equipment',
  ComputerEquipment = 'computer_equipment',
  OfficeEquipment = 'office_equipment',
  KitchenEquipment = 'kitchen_equipment',
  SanitaryEquipment = 'sanitary_equipment',
  CleaningEquipment = 'cleaning_equipment',
  AudioVideoRecordingEquipment = 'audio_video_recording_equipment',
  OfficeFurniture = 'office_furniture',
  KitchenFurniture = 'kitchen_furniture',
  GeneralFurniture = 'general_furniture',
  MusicalInstruments = 'musical_instruments',
  InternetTelephoneServices = 'internet_and_telephone_services',
  HostingSoftwareServices = 'hosting_and_software_services',

  //* Supplies Expenses
  KitchenUtensils = 'kitchen_utensils',
  OfficeSupplies = 'office_supplies',
  CookingIngredients = 'cooking_ingredients',
  CleaningMaterials = 'cleaning_materials',
  PackagingMaterials = 'packaging_and_storage_materials',
  SundaySchoolMaterials = 'sunday_school_educational_materials',
  RenovationMaterials = 'renovation_materials',
  PlumbingSupplies = 'plumbing_supplies',
  PaintingSupplies = 'painting_supplies',
  ElectricalSupplies = 'electrical_supplies',
  ConstructionTools = 'construction_tools',
  AudioVisualSupplies = 'audio_visual_supplies',
  SafetyEquipment = 'safety_equipment',
  FirstAidSupplies = 'first_aid_supplies',

  //* Planing Events Expenses
  AdvertisingAndEventPromotion = 'advertising_and_event_promotion',
  SpecialGuestsFees = 'special_guests_fess',
  SecurityPersonnelFees = 'security_personnel_fees',
  SupportStaffFees = 'support_staff_fees',
  ExternalVenueRental = 'external_venue_rental',
  FoodAndBeverage = 'food_and_beverage',
  TransportationSpecialGuests = 'transportation_special_guests',
  EquipmentTransportation = 'equipment_transportation',
  RentalTechnicalEquipment = 'rental_technical_equipment',
  PrivateMobilityRental = 'private_mobility_rental',
  EducationalMaterials = 'educational_materials',
  GiftsAndPrizesParticipants = 'gifts_and_prizes_participants',
  OtherRelatedExpenses = 'other_related_expenses',

  //* Other Expenses
  FraternalSupport = 'fraternal_Support',
  EmergencyRepairs = 'emergency_repairs',
  HospitalityExpenses = 'hospitality_expenses',
  MissionDonations = 'mission_donations',
  TrainingAndEducation = 'training_and_education',
  LegalAndAdministrative = 'legal_and_administrative',
  SpecialsProjects = 'special_projects',
}

export const SearchSubTypeNames: Record<SearchSubType, string> = {
  [SearchSubType.DiscipleByPastorFirstNames]: 'Por nombres de su pastor',
  [SearchSubType.DiscipleByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.DiscipleByPastorFullNames]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.DiscipleByCopastorFirstNames]: 'Por nombres de su co-pastor',
  [SearchSubType.DiscipleByCopastorLastNames]: 'Por apellidos de su co-pastor',
  [SearchSubType.DiscipleByCopastorFullNames]:
    'Por nombres y apellidos de su co-pastor',
  [SearchSubType.DiscipleBySupervisorFirstNames]:
    'Por nombres de su supervisor',
  [SearchSubType.DiscipleBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [SearchSubType.DiscipleBySupervisorFullNames]:
    'Por nombres y apellidos de su supervisor',
  [SearchSubType.DiscipleByPreacherFirstNames]: 'Por nombres de su predicador',
  [SearchSubType.DiscipleByPreacherLastNames]: 'Por apellidos de su predicador',
  [SearchSubType.DiscipleByPreacherFullNames]:
    'Por nombres y apellidos de su predicador',
  [SearchSubType.ByDiscipleFirstNames]: 'Por sus nombres',
  [SearchSubType.ByDiscipleLastNames]: 'Por sus apellidos',
  [SearchSubType.ByDiscipleFullNames]: 'Por sus nombres y apellidos',

  [SearchSubType.CopastorByPastorFirstNames]: 'Por nombres de su pastor',
  [SearchSubType.CopastorByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.CopastorByPastorFullNames]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.ByCopastorFirtsNames]: 'Por sus nombres',
  [SearchSubType.ByCopastorLastNames]: 'Por sus apellidos',
  [SearchSubType.ByCopastorFullNames]: 'Por sus nombres y apellidos',

  [SearchSubType.SupervisorByPastorFirstNames]: 'Por nombres de su pastor',
  [SearchSubType.SupervisorByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.SupervisorByPastorFullNames]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.SupervisorByCopastorFirstNames]: 'Por nombres de su co-pastor',
  [SearchSubType.SupervisorByCopastorLastNames]:
    'Por apellidos de su co-pastor',
  [SearchSubType.SupervisorByCopastorFullNames]:
    'Por nombres y apellidos de su co-pastor',
  [SearchSubType.BySupervisorFirstNames]: 'Por sus nombres',
  [SearchSubType.BySupervisorLastNames]: 'Por sus apellidos',
  [SearchSubType.BySupervisorFullNames]: 'Por sus nombres y apellidos',

  [SearchSubType.PreacherByPastorFirstNames]: 'Por nombres de su pastor',
  [SearchSubType.PreacherByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.PreacherByPastorFullNames]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.PreacherByCopastorFirstNames]: 'Por nombres de su co-pastor',
  [SearchSubType.PreacherByCopastorLastNames]: 'Por apellidos de su co-pastor',
  [SearchSubType.PreacherByCopastorFullNames]:
    'Por nombres y apellidos de su co-pastor',
  [SearchSubType.PreacherBySupervisorFirstNames]:
    'Por nombres de su supervisor',
  [SearchSubType.PreacherBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [SearchSubType.PreacherBySupervisorFullNames]:
    'Por nombres y apellidos de su supervisor',
  [SearchSubType.ByPreacherFirstNames]: 'Por sus nombres',
  [SearchSubType.ByPreacherLastNames]: 'Por sus apellidos',
  [SearchSubType.ByPreacherFullNames]: 'Por sus nombres y apellidos',

  [SearchSubType.ZoneByPastorFirstNames]: 'Por nombres de su pastor',
  [SearchSubType.ZoneByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.ZoneByPastorFullNames]: 'Por nombres y apellidos de su pastor',
  [SearchSubType.ZoneByCopastorFirstNames]: 'Por nombres de su co-pastor',
  [SearchSubType.ZoneByCopastorLastNames]: 'Por apellidos de su co-pastor',
  [SearchSubType.ZoneByCopastorFullNames]:
    'Por nombres y apellidos de su co-pastor',
  [SearchSubType.ZoneBySupervisorFirstNames]: 'Por nombres de su supervisor',
  [SearchSubType.ZoneBySupervisorLastNames]: 'Por apellidos de su supervisor',
  [SearchSubType.ZoneBySupervisorFullNames]:
    'Por nombres y apellidos de su supervisor',

  [SearchSubType.FamilyGroupByPastorFirstNames]: 'Por nombres de su pastor',
  [SearchSubType.FamilyGroupByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.FamilyGroupByPastorFullNames]:
    'Por nombres y apellidos de su pastor',
  [SearchSubType.FamilyGroupByCopastorFirstNames]:
    'Por nombres de su co-pastor',
  [SearchSubType.FamilyGroupByCopastorLastNames]:
    'Por apellidos de su co-pastor',
  [SearchSubType.FamilyGroupByCopastorFullNames]:
    'Por nombres y apellidos de su co-pastor',
  [SearchSubType.FamilyGroupBySupervisorFirstNames]:
    'Por nombres de su supervisor',
  [SearchSubType.FamilyGroupBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [SearchSubType.FamilyGroupBySupervisorFullNames]:
    'Por nombres y apellidos de su supervisor',
  [SearchSubType.FamilyGroupByPreacherFirstNames]:
    'Por nombres de su predicador',
  [SearchSubType.FamilyGroupByPreacherLastNames]:
    'Por apellidos de su predicador',
  [SearchSubType.FamilyGroupByPreacherFullNames]:
    'Por nombres y apellidos de su predicador',

  [SearchSubType.MinistryByPastorFirstNames]: 'Por nombres de su pastor',
  [SearchSubType.MinistryByPastorLastNames]: 'Por apellidos de su pastor',
  [SearchSubType.MinistryByPastorFullNames]:
    'Por nombres y apellidos de su pastor',

  [SearchSubType.OfferingByDate]: 'Por fecha',

  // Sunday service, youngs, school sunday
  [SearchSubType.OfferingByShift]: 'Por turno',
  [SearchSubType.OfferingByShiftDate]: 'Por fecha y turno',

  // Family Group, Fasting Zonal, Vigil Zonal
  [SearchSubType.OfferingByZone]: 'Por zona',
  [SearchSubType.OfferingByZoneDate]: 'Por zona y fecha',

  // Family Group
  [SearchSubType.OfferingByPreacherFirstNames]: 'Por nombres de su predicador',
  [SearchSubType.OfferingByPreacherLastNames]: 'Por apellidos de su predicador',
  [SearchSubType.OfferingByPreacherFullNames]:
    'Por nombres y apellidos de su predicador',
  [SearchSubType.OfferingByGroupCode]: 'Por código de grupo fam.',
  [SearchSubType.OfferingByGroupCodeDate]: 'Por código de grupo fam. y fecha',

  // Offering Ayuno Zonal y Vigilia Zonal
  [SearchSubType.OfferingBySupervisorFirstNames]:
    'Por nombres de su supervisor',
  [SearchSubType.OfferingBySupervisorLastNames]:
    'Por apellidos de su supervisor',
  [SearchSubType.OfferingBySupervisorFullNames]:
    'Por nombres y apellidos de su supervisor',

  // Offering Ground Church and Special
  [SearchSubType.OfferingByContributorFirstNames]: 'Por nombres del aportante',
  [SearchSubType.OfferingByContributorLastNames]: 'Por apellidos del aportante',
  [SearchSubType.OfferingByContributorFullNames]:
    'Por nombres y apellidos del aportante',

  // Operative Expenses
  [SearchSubType.VenueRental]: 'Alquiler de local',
  [SearchSubType.PublicServices]: 'Servicios públicos',
  [SearchSubType.InsuranceAndTaxes]: 'Seguros y/o impuestos',
  [SearchSubType.TransportationAndTravelAllowance]: 'Transporte y/o viáticos',
  [SearchSubType.SecurityAndSurveillance]: 'Seguridad y vigilancia',
  [SearchSubType.OtherAdministrativeExpenses]: 'Otros gastos administrativos',

  // Maintenance and Repair Expenses
  [SearchSubType.PlumbingServices]: 'Servicios de gasfiteria',
  [SearchSubType.ElectricalServices]: 'Servicios de electricidad',
  [SearchSubType.PaintingAndTouchUpsServices]:
    'Servicios de pintura y retoques',
  [SearchSubType.CleaningServices]: 'Servicios de limpieza',
  [SearchSubType.HeatingAndACSystemMaintenance]: 'Mantenimiento de SC y AC',
  [SearchSubType.SoundAndLightingEquipmentMaintenance]:
    'Mant. Equipos de sonido e iluminación',
  [SearchSubType.GardenAndExteriorMaintenance]: 'Mant. Jardines y exteriores',
  [SearchSubType.FurnitureRepairAndMaintenance]: 'Mant. Muebles',
  [SearchSubType.ComputerEquipmentRepairAndMaintenance]:
    'Mant. Equipos informáticos',
  [SearchSubType.GeneralEquipmentMaintenance]: 'Mant. Equipos en general',
  [SearchSubType.GeneralEquipmentRepairs]: 'Rep. Equipos en general',
  [SearchSubType.RoofAndStructuralRepairs]: 'Rep. Techo y estructuras',
  [SearchSubType.DoorAndWindowRepairs]: 'Rep. Puertas y ventanas',
  [SearchSubType.SoundAndLightingEquipmentRepairs]:
    'Rep. Equipos de sonido e iluminación',

  // Decoration Expenses
  [SearchSubType.PurchaseFlowersAndPlants]: 'Adq. Flores y plantas',
  [SearchSubType.PurchaseDecorativeFurniture]: 'Adq. Muebles decorativos',
  [SearchSubType.PurchaseDecorativeItems]: 'Adq. Artículos decorativos',
  [SearchSubType.DecorationServices]: 'Serv. Decoración general',
  [SearchSubType.LightingAndIlluminationServices]:
    'Serv. Iluminación y efectos',
  [SearchSubType.StageSetupServices]: 'Serv. Montaje de escenario',
  [SearchSubType.EventDecorationRentals]: 'Alq. Decoraciones especiales',
  [SearchSubType.CleaningPostEventServices]: 'Serv. Limpieza post-evento',

  // Equipment and Technology Expenses
  [SearchSubType.SoundEquipment]: 'Equipos de sonido',
  [SearchSubType.ProjectionEquipment]: 'Equipos de proyección',
  [SearchSubType.HvacEquipment]: 'Equipos de ventilación, SC y AC',
  [SearchSubType.LightingEquipment]: 'Equipos de iluminación',
  [SearchSubType.SecurityEquipment]: 'Equipos de seguridad',
  [SearchSubType.OfficeEquipment]: 'Equipos de oficina',
  [SearchSubType.ComputerEquipment]: 'Equipos informáticos',
  [SearchSubType.SanitaryEquipment]: 'Equipos sanitarios',
  [SearchSubType.KitchenEquipment]: 'Equipos de cocina',
  [SearchSubType.CleaningEquipment]: 'Equipos de limpieza',
  [SearchSubType.AudioVideoRecordingEquipment]: 'Equipos de grabación (a/v)',
  [SearchSubType.OfficeFurniture]: 'Mobiliarios informáticos',
  [SearchSubType.KitchenFurniture]: 'Mobiliarios de cocina',
  [SearchSubType.GeneralFurniture]: 'Mobiliarios en general',
  [SearchSubType.MusicalInstruments]: 'Instrumentos musicales',
  [SearchSubType.InternetTelephoneServices]: 'Serv. Internet y telefonía',
  [SearchSubType.HostingSoftwareServices]: 'Serv. Hosting y software',

  // Supplies Expenses
  [SearchSubType.KitchenUtensils]: 'Utensilios de cocina',
  [SearchSubType.CookingIngredients]: 'Insumos de cocina',
  [SearchSubType.OfficeSupplies]: 'Utensilios de oficina',
  [SearchSubType.CleaningMaterials]: 'Materiales de limpieza',
  [SearchSubType.PackagingMaterials]: 'Materiales de almacenamiento',
  [SearchSubType.SundaySchoolMaterials]: 'Material educativo (Esc. Dom.)',
  [SearchSubType.RenovationMaterials]: 'Repuestos en general',
  [SearchSubType.PlumbingSupplies]: 'Utensilios de de plomeria',
  [SearchSubType.PaintingSupplies]: 'Utensilios y materiales de pintura',
  [SearchSubType.ElectricalSupplies]: 'Materiales de electricidad',
  [SearchSubType.ConstructionTools]: 'Herramientas de construcción',
  [SearchSubType.AudioVisualSupplies]: 'Utensilios de audio y video ',
  [SearchSubType.SafetyEquipment]: 'Utensilios de seguridad.',
  [SearchSubType.FirstAidSupplies]: 'Insumos y utensilios de primeros auxilios',

  // Planing Events Expenses
  [SearchSubType.AdvertisingAndEventPromotion]:
    'Publicidad y promoción de eventos',
  [SearchSubType.SpecialGuestsFees]: 'Hon. Invitados especiales',
  [SearchSubType.SupportStaffFees]: 'Hon. Personal de apoyo',
  [SearchSubType.SecurityPersonnelFees]: 'Hon. Personal de seguridad',
  [SearchSubType.ExternalVenueRental]: 'Alq. Local externo',
  [SearchSubType.RentalTechnicalEquipment]: 'Alq. Equipos técnicos',
  [SearchSubType.TransportationSpecialGuests]: 'Trans. Invitados especiales',
  [SearchSubType.EquipmentTransportation]: 'Trans. Equipos',
  [SearchSubType.PrivateMobilityRental]: 'Alq. Movilidad particular',
  [SearchSubType.FoodAndBeverage]: 'Alimentación y bebida',
  [SearchSubType.EducationalMaterials]: 'Material didáctico',
  [SearchSubType.GiftsAndPrizesParticipants]: 'Premios y regalos',
  [SearchSubType.OtherRelatedExpenses]: 'Otros gastos relacionados',

  // Other Expenses
  [SearchSubType.FraternalSupport]: 'Apoyo a hermanos de la iglesia',
  [SearchSubType.EmergencyRepairs]: 'Rep. urgentes de instalaciones y equipos',
  [SearchSubType.HospitalityExpenses]:
    'Alojamiento y alimentación de invitados',
  [SearchSubType.MissionDonations]: 'Apoyo económico a misiones y misioneros',
  [SearchSubType.TrainingAndEducation]: 'Capacitación para líderes y pastores',
  [SearchSubType.LegalAndAdministrative]: 'Gastos legales o administrativos',
  [SearchSubType.SpecialsProjects]: 'Proyectos especiales',
};
