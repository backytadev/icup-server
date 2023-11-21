import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { PaginationDto, SearchTypeAndPaginationDto } from 'src/common/dtos';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.membersService.findAll(paginationDto);
  }

  @Get(':term')
  findOne(
    //FIXME : para hacerlo oblugatorio debo usar DTO y class validator.
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchTypeAndPaginationDto,
  ) {
    return this.membersService.findTerm(term, searchTypeAndPaginationDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, updateMemberDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.remove(id);
  }
}
