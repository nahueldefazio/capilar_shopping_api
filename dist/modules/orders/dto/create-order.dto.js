"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateOrderDto = exports.OrderShippingInputDto = exports.OrderCustomerDto = exports.OrderItemInputDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const sale_type_enum_1 = require("../../../common/enums/sale-type.enum");
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+$/;
const PHONE_PATTERN = /^(?!\+?(\d)(?:[\s().-]*\1){7,}[\s().-]*$)\+?[\d\s().-]{8,22}$/;
const CITY_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .'-]{2,80}$/;
const STREET_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .'-]{2,100}$/;
const POSTAL_CODE_PATTERN = /^[A-Za-z0-9]{4,8}$/;
const STREET_NUMBER_PATTERN = /^[1-9][0-9]{0,5}[A-Za-z]?$/;
const APARTMENT_PATTERN = /^[A-Za-z0-9 .°º/-]{0,30}$/;
class OrderItemInputDto {
    productId;
    quantity;
}
exports.OrderItemInputDto = OrderItemInputDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], OrderItemInputDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], OrderItemInputDto.prototype, "quantity", void 0);
class OrderCustomerDto {
    fullName;
    email;
    phone;
    customerType;
    address;
    province;
    city;
    postalCode;
}
exports.OrderCustomerDto = OrderCustomerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(5, 80),
    (0, class_validator_1.Matches)(NAME_PATTERN),
    __metadata("design:type", String)
], OrderCustomerDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], OrderCustomerDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(22),
    (0, class_validator_1.Matches)(PHONE_PATTERN),
    __metadata("design:type", String)
], OrderCustomerDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(sale_type_enum_1.SaleType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OrderCustomerDto.prototype, "customerType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(140),
    __metadata("design:type", String)
], OrderCustomerDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], OrderCustomerDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], OrderCustomerDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(8),
    __metadata("design:type", String)
], OrderCustomerDto.prototype, "postalCode", void 0);
class OrderShippingInputDto {
    province;
    city;
    postalCode;
    street;
    streetNumber;
    apartment;
}
exports.OrderShippingInputDto = OrderShippingInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], OrderShippingInputDto.prototype, "province", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(2, 80),
    (0, class_validator_1.Matches)(CITY_PATTERN),
    __metadata("design:type", String)
], OrderShippingInputDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(POSTAL_CODE_PATTERN),
    __metadata("design:type", String)
], OrderShippingInputDto.prototype, "postalCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(2, 100),
    (0, class_validator_1.Matches)(STREET_PATTERN),
    __metadata("design:type", String)
], OrderShippingInputDto.prototype, "street", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(STREET_NUMBER_PATTERN),
    __metadata("design:type", String)
], OrderShippingInputDto.prototype, "streetNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(30),
    (0, class_validator_1.Matches)(APARTMENT_PATTERN),
    __metadata("design:type", String)
], OrderShippingInputDto.prototype, "apartment", void 0);
class CreateOrderDto {
    customer;
    shipping;
    items;
    notes;
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => OrderCustomerDto),
    __metadata("design:type", OrderCustomerDto)
], CreateOrderDto.prototype, "customer", void 0);
__decorate([
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => OrderShippingInputDto),
    __metadata("design:type", OrderShippingInputDto)
], CreateOrderDto.prototype, "shipping", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => OrderItemInputDto),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "notes", void 0);
//# sourceMappingURL=create-order.dto.js.map