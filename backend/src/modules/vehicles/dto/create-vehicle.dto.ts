import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString() brand: string;
  @IsString() model: string;
  @IsInt() @Min(1980) @Max(2100) year: number;
  @IsString() licensePlate: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsInt() @Min(1) @Max(9) seats?: number;
  @IsIn(['essence', 'diesel', 'hybride', 'electrique', 'gpl']) fuelType: string;
  @IsIn(['manuelle', 'automatique']) transmission: string;

  @IsNumber() lat: number;
  @IsNumber() lng: number;
  @IsOptional() @IsInt() communeId?: number;
  @IsOptional() @IsString() addressLabel?: string;

  @IsNumber() @Min(1) pricePerDay: number;
  @IsOptional() @IsNumber() @Min(0) depositAmount?: number;
  @IsOptional() @IsInt() minRentalDays?: number;
  @IsOptional() @IsInt() maxRentalDays?: number;
  @IsOptional() instantBooking?: boolean;
  @IsOptional() @IsInt() mileageLimitPerDay?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() features?: string[];
}
