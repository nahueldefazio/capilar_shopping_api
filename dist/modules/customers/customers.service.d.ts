import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersService {
    private readonly customerRepo;
    constructor(customerRepo: Repository<Customer>);
    findAll(): Promise<Customer[]>;
    findOne(id: number): Promise<Customer>;
    findOrCreateByEmail(dto: CreateCustomerDto): Promise<Customer>;
    create(dto: CreateCustomerDto): Promise<Customer>;
    update(id: number, dto: UpdateCustomerDto): Promise<Customer>;
}
