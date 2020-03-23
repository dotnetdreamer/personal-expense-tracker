import { Injectable } from "@nestjs/common";


@Injectable()
export class HelperService {
    isValidDate(date) {
        return date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date);
    }
}