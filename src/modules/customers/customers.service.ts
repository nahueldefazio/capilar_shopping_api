import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  findAll(): Promise<Customer[]> {
    return this.customerRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({ where: { id }, relations: ['orders'] });
    if (!customer) throw new NotFoundException(`Customer #${id} not found`);
    return customer;
  }

  async findOrCreateByEmail(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.customerRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      // Update info with latest order data
      Object.assign(existing, dto);
      return this.customerRepo.save(existing);
    }
    return this.create(dto);
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepo.create(dto);
    return this.customerRepo.save(customer);
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }
}
