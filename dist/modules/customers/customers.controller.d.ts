import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    findAll(): Promise<import("./entities/customer.entity").Customer[]>;
    findOne(id: number): Promise<import("./entities/customer.entity").Customer>;
    create(dto: CreateCustomerDto): Promise<import("./entities/customer.entity").Customer>;
    update(id: number, dto: UpdateCustomerDto): Promise<import("./entities/customer.entity").Customer>;
}
