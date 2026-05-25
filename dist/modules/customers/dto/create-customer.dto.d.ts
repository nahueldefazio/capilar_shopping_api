import { SaleType } from '../../../common/enums/sale-type.enum';
export declare class CreateCustomerDto {
    fullName: string;
    email: string;
    phone?: string;
    customerType?: SaleType;
    address?: string;
    province?: string;
    city?: string;
    postalCode?: string;
}
