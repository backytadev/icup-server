export enum OfferingExpenseSearchSubType {
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
  SoundEquipmentMaintenance = 'sound_equipment_maintenance',
  LightingEquipmentMaintenance = 'lighting_equipment_maintenance',
  LightingEquipmentRepairs = 'lighting_equipment_repairs',
  SoundEquipmentRepairs = 'sound_equipment_repairs',
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
  ConstructionEquipment = 'construction_equipment',
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
  EvangelismMaterials = 'evangelism_materials',
  LibraryMaterials = 'library_materials',
  MinistryMaterials = 'ministry_materials',

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
  EducationalMaterials = 'educational_materials',
  PrivateMobilityRental = 'private_mobility_rental',
  GiftsAndPrizesParticipants = 'gifts_and_prizes_participants',
  OtherRelatedExpenses = 'other_related_expenses',

  //* Other Expenses
  FraternalSupport = 'fraternal_support',
  EmergencyRepairs = 'emergency_repairs',
  HospitalityExpenses = 'hospitality_expenses',
  MissionDonations = 'mission_donations',
  TrainingAndEducation = 'training_and_education',
  LegalAndAdministrative = 'legal_and_administrative',
  SpecialsProjects = 'special_projects',
}

export const OfferingExpenseSearchSubTypeNames: Record<
  OfferingExpenseSearchSubType,
  string
> = {
  // Operative Expenses
  [OfferingExpenseSearchSubType.VenueRental]: 'Alquiler de local',
  [OfferingExpenseSearchSubType.PublicServices]: 'Servicios públicos',
  [OfferingExpenseSearchSubType.InsuranceAndTaxes]: 'Seguros y/o impuestos',
  [OfferingExpenseSearchSubType.TransportationAndTravelAllowance]:
    'Transporte y/o viáticos',
  [OfferingExpenseSearchSubType.SecurityAndSurveillance]:
    'Seguridad y vigilancia',
  [OfferingExpenseSearchSubType.OtherAdministrativeExpenses]:
    'Otros gastos administrativos',

  // Maintenance and Repair Expenses
  [OfferingExpenseSearchSubType.PlumbingServices]: 'Servicios de gasfiteria',
  [OfferingExpenseSearchSubType.ElectricalServices]:
    'Servicios de electricidad',
  [OfferingExpenseSearchSubType.PaintingAndTouchUpsServices]:
    'Servicios de pintura y retoques',
  [OfferingExpenseSearchSubType.CleaningServices]: 'Servicios de limpieza',
  [OfferingExpenseSearchSubType.HeatingAndACSystemMaintenance]:
    'Mantenimiento de SC y AC',
  [OfferingExpenseSearchSubType.SoundEquipmentMaintenance]:
    'Mant. Equipos de sonido',
  [OfferingExpenseSearchSubType.LightingEquipmentMaintenance]:
    'Mant. Equipos de iluminación',
  [OfferingExpenseSearchSubType.GardenAndExteriorMaintenance]:
    'Mant. Jardines y exteriores',
  [OfferingExpenseSearchSubType.FurnitureRepairAndMaintenance]: 'Mant. Muebles',
  [OfferingExpenseSearchSubType.ComputerEquipmentRepairAndMaintenance]:
    'Mant. Equipos informáticos',
  [OfferingExpenseSearchSubType.GeneralEquipmentMaintenance]:
    'Mant. Equipos en general',
  [OfferingExpenseSearchSubType.GeneralEquipmentRepairs]:
    'Rep. Equipos en general',
  [OfferingExpenseSearchSubType.RoofAndStructuralRepairs]:
    'Rep. Techo y estructuras',
  [OfferingExpenseSearchSubType.DoorAndWindowRepairs]:
    'Rep. Puertas y ventanas',
  [OfferingExpenseSearchSubType.SoundEquipmentRepairs]:
    'Rep. Equipos de sonido',
  [OfferingExpenseSearchSubType.LightingEquipmentRepairs]:
    'Rep. Equipos de iluminación',

  // Decoration Expenses
  [OfferingExpenseSearchSubType.PurchaseFlowersAndPlants]:
    'Adq. Flores y plantas',
  [OfferingExpenseSearchSubType.PurchaseDecorativeFurniture]:
    'Adq. Muebles decorativos',
  [OfferingExpenseSearchSubType.PurchaseDecorativeItems]:
    'Adq. Artículos decorativos',
  [OfferingExpenseSearchSubType.DecorationServices]: 'Serv. Decoración general',
  [OfferingExpenseSearchSubType.LightingAndIlluminationServices]:
    'Serv. Iluminación y efectos',
  [OfferingExpenseSearchSubType.StageSetupServices]:
    'Serv. Montaje de escenario',
  [OfferingExpenseSearchSubType.EventDecorationRentals]:
    'Alq. Decoraciones especiales',
  [OfferingExpenseSearchSubType.CleaningPostEventServices]:
    'Serv. Limpieza post-evento',

  // Equipment and Technology Expenses
  [OfferingExpenseSearchSubType.SoundEquipment]: 'Equipos de sonido',
  [OfferingExpenseSearchSubType.ProjectionEquipment]: 'Equipos de proyección',
  [OfferingExpenseSearchSubType.HvacEquipment]:
    'Equipos de ventilación, SC y AC',
  [OfferingExpenseSearchSubType.LightingEquipment]: 'Equipos de iluminación',
  [OfferingExpenseSearchSubType.SecurityEquipment]: 'Equipos de seguridad',
  [OfferingExpenseSearchSubType.OfficeEquipment]: 'Equipos de oficina',
  [OfferingExpenseSearchSubType.ComputerEquipment]: 'Equipos informáticos',
  [OfferingExpenseSearchSubType.ConstructionEquipment]:
    'Equipos de construcción',
  [OfferingExpenseSearchSubType.KitchenEquipment]: 'Equipos de cocina',
  [OfferingExpenseSearchSubType.CleaningEquipment]: 'Equipos de limpieza',
  [OfferingExpenseSearchSubType.SanitaryEquipment]: 'Equipos sanitarios',
  [OfferingExpenseSearchSubType.AudioVideoRecordingEquipment]:
    'Equipos de grabación (a/v)',
  [OfferingExpenseSearchSubType.OfficeFurniture]: 'Mobiliarios informáticos',
  [OfferingExpenseSearchSubType.KitchenFurniture]: 'Mobiliarios de cocina',
  [OfferingExpenseSearchSubType.GeneralFurniture]: 'Mobiliarios en general',
  [OfferingExpenseSearchSubType.MusicalInstruments]: 'Instrumentos musicales',
  [OfferingExpenseSearchSubType.InternetTelephoneServices]:
    'Serv. Internet y telefonía',
  [OfferingExpenseSearchSubType.HostingSoftwareServices]:
    'Serv. Hosting y software',

  // Supplies Expenses
  [OfferingExpenseSearchSubType.KitchenUtensils]: 'Utensilios de cocina',
  [OfferingExpenseSearchSubType.CookingIngredients]: 'Insumos de cocina',
  [OfferingExpenseSearchSubType.OfficeSupplies]: 'Utensilios de oficina',
  [OfferingExpenseSearchSubType.CleaningMaterials]: 'Materiales de limpieza',
  [OfferingExpenseSearchSubType.PlumbingSupplies]: 'Utensilios de de plomeria',
  [OfferingExpenseSearchSubType.PackagingMaterials]:
    'Materiales de almacenamiento',
  [OfferingExpenseSearchSubType.SundaySchoolMaterials]:
    'Material educativo (Esc. Dom.)',
  [OfferingExpenseSearchSubType.RenovationMaterials]: 'Repuestos en general',
  [OfferingExpenseSearchSubType.PaintingSupplies]:
    'Utensilios y materiales de pintura',
  [OfferingExpenseSearchSubType.ElectricalSupplies]:
    'Materiales de electricidad',
  [OfferingExpenseSearchSubType.ConstructionTools]:
    'Herramientas de construcción',
  [OfferingExpenseSearchSubType.AudioVisualSupplies]:
    'Utensilios de audio y video ',
  [OfferingExpenseSearchSubType.SafetyEquipment]: 'Utensilios de seguridad.',
  [OfferingExpenseSearchSubType.FirstAidSupplies]:
    'Insumos y utensilios de primeros auxilios',
  [OfferingExpenseSearchSubType.EvangelismMaterials]:
    'Materiales de evangelismo',
  [OfferingExpenseSearchSubType.LibraryMaterials]:
    'Materiales para biblioteca (Biblias y libros)',
  [OfferingExpenseSearchSubType.MinistryMaterials]:
    'Materiales para ministerios',

  // Planing Events Expenses
  [OfferingExpenseSearchSubType.AdvertisingAndEventPromotion]:
    'Publicidad y promoción de eventos',
  [OfferingExpenseSearchSubType.SpecialGuestsFees]: 'Hon. Invitados especiales',
  [OfferingExpenseSearchSubType.SupportStaffFees]: 'Hon. Personal de apoyo',
  [OfferingExpenseSearchSubType.SecurityPersonnelFees]:
    'Hon. Personal de seguridad',
  [OfferingExpenseSearchSubType.ExternalVenueRental]: 'Alq. Local externo',
  [OfferingExpenseSearchSubType.RentalTechnicalEquipment]:
    'Alq. Equipos técnicos',
  [OfferingExpenseSearchSubType.TransportationSpecialGuests]:
    'Trans. Invitados especiales',
  [OfferingExpenseSearchSubType.EquipmentTransportation]: 'Trans. Equipos',
  [OfferingExpenseSearchSubType.PrivateMobilityRental]:
    'Alq. Movilidad particular',
  [OfferingExpenseSearchSubType.FoodAndBeverage]: 'Alimentación y bebida',
  [OfferingExpenseSearchSubType.EducationalMaterials]: 'Material didáctico',
  [OfferingExpenseSearchSubType.GiftsAndPrizesParticipants]:
    'Premios y regalos',
  [OfferingExpenseSearchSubType.OtherRelatedExpenses]:
    'Otros gastos relacionados',

  // Other Expenses
  [OfferingExpenseSearchSubType.FraternalSupport]:
    'Apoyo a hermanos de la iglesia',
  [OfferingExpenseSearchSubType.EmergencyRepairs]:
    'Rep. urgentes de instalaciones y equipos',
  [OfferingExpenseSearchSubType.HospitalityExpenses]:
    'Alojamiento y alimentación de invitados',
  [OfferingExpenseSearchSubType.MissionDonations]:
    'Apoyo económico a misiones y misioneros',
  [OfferingExpenseSearchSubType.TrainingAndEducation]:
    'Capacitación para líderes y pastores',
  [OfferingExpenseSearchSubType.LegalAndAdministrative]:
    'Gastos legales o administrativos',
  [OfferingExpenseSearchSubType.SpecialsProjects]: 'Proyectos especiales',
};
