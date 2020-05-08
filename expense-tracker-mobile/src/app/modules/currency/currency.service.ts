import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class CurrencyService {
    constructor() {

    }

    getAllCurrenciesLocal() {
        return Promise.resolve([
            "AED",
            "PKR",
            "USD",
            "EUR"
        ]);
    }
}