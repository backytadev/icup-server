import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, In, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { memberProportionFormatter } from '@/modules/metrics/helpers/member/member-proportion-formatter.helper';
import { memberFormatterByCategory } from '@/modules/metrics/helpers/member/member-formatter-by-category.helper';
import { memberFluctuationFormatter } from '@/modules/metrics/helpers/member/member-fluctuation-formatter.helper';
import { memberFormatterByBirthMonth } from '@/modules/metrics/helpers/member/member-formatter-by-birth-month.helper';
import { memberFormatterByRecordStatus } from '@/modules/metrics/helpers/member/member-formatter-by-record-status.helper';
import { memberFormatterByMaritalStatus } from '@/modules/metrics/helpers/member/member-formatter-by-marital-status.helper';
import { memberFormatterByRoleAndGender } from '@/modules/metrics/helpers/member/member-formatter-by-role-and-gender.helper';
import { discipleFormatterByZoneAndGender } from '@/modules/metrics/helpers/member/disciple-formatter-by-zone-and-gender.helper';
import { preacherFormatterByZoneAndGender } from '@/modules/metrics/helpers/member/preacher-formatter-by-zone-and-gender.helper';
import { memberFormatterByDistrictAndGender } from '@/modules/metrics/helpers/member/member-formatter-by-district-and-gender.helper';
import { memberFormatterByCategoryAndGender } from '@/modules/metrics/helpers/member/member-formatter-by-category-and-gender.helper';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';

@Injectable()
export class MemberMetricsService {
  private readonly logger = new Logger('MemberMetricsService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(Copastor)
    private readonly copastorRepository: Repository<Copastor>,

    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

    @InjectRepository(Preacher)
    private readonly preacherRepository: Repository<Preacher>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,
  ) {}

  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    const { searchType, order = 'DESC', allZones } = searchTypeAndPaginationDto;

    //? MEMBER METRICS
    //* Members Proportion
    if (term && searchType === MetricSearchType.MembersByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church },
              order: {
                createdAt: order as FindOptionsOrderValue,
              },
              relations: ['member'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
          ]);

        return memberProportionFormatter({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members fluctuation analysis by year
    if (term && searchType === MetricSearchType.MembersFluctuationByYear) {
      const [churchId, yearValue] = term.split('&');
      const year = +yearValue;

      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      // New
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const newMembers = await Promise.all([
          this.pastorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.copastorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.supervisorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.preacherRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.discipleRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
        ]);

        // Inactive
        const inactiveMembers = await Promise.all([
          this.pastorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.copastorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.supervisorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.preacherRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.discipleRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
        ]);

        return memberFluctuationFormatter({
          newMembers,
          inactiveMembers,
          church,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by birth month
    if (term && searchType === MetricSearchType.MembersByBirthMonth) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByBirthMonth({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by category
    if (term && searchType === MetricSearchType.MembersByCategory) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
          ]);

        return memberFormatterByCategory({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by category and gender
    if (term && searchType === MetricSearchType.MembersByCategoryAndGender) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByCategoryAndGender({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by role and gender
    if (term && searchType === MetricSearchType.MembersByRoleAndGender) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByRoleAndGender({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by marital status
    if (term && searchType === MetricSearchType.MembersByMaritalStatus) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByMaritalStatus({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Disciples analysis by zone and gender
    if (term && searchType === MetricSearchType.DisciplesByZoneAndGender) {
      const [churchId, copastorId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastor = await this.copastorRepository.findOne({
            where: {
              id: copastorId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'zones'],
          });

          if (!copastor) return [];

          const zonesId = copastor.zones.map((zone) => zone?.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId ?? []),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'disciples.member',
            ],
          });

          return discipleFormatterByZoneAndGender({
            zones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastors = await this.copastorRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'zones'],
          });

          const zonesByCopastor = copastors
            .map((copastor) => copastor?.zones)
            .flat();

          const zonesId = zonesByCopastor.map((zone) => zone?.id);

          const allZones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'disciples.member',
            ],
          });

          return discipleFormatterByZoneAndGender({
            zones: allZones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Preachers analysis by zone and gender
    if (term && searchType === MetricSearchType.PreachersByZoneAndGender) {
      const [churchId, copastorId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastor = await this.copastorRepository.findOne({
            where: {
              id: copastorId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'zones'],
          });

          if (!copastor) return [];

          const zonesId = copastor.zones.map((zone) => zone?.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'preachers.member',
            ],
          });

          return preacherFormatterByZoneAndGender({
            zones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastors = await this.copastorRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'zones'],
          });

          const zonesByCopastor = copastors
            .map((copastor) => copastor?.zones)
            .flat();

          const zonesId = zonesByCopastor.map((zone) => zone?.id);

          const allZones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'preachers.member',
            ],
          });

          return preacherFormatterByZoneAndGender({
            zones: allZones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Members analysis by district and gender
    if (term && searchType === MetricSearchType.MembersByDistrictAndGender) {
      const [churchId, district] = term.split('&');

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByDistrictAndGender({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by record status
    if (term && searchType === MetricSearchType.MembersByRecordStatus) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: {
                theirChurch: church,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: {
                theirChurch: church,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByRecordStatus({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(`${error.message}`);
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
