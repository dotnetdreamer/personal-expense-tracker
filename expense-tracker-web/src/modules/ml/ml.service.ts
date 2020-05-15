import { Injectable } from "@nestjs/common";

import * as brain from 'brain.js';
import * as natural from 'natural';
import * as fs from 'fs';

import { ExpenseService } from "src/modules/expense/expense.service";
import { CategoryService } from "src/modules/category/category.service";
import { Expense } from "src/modules/expense/expense.entity";
import { AppConstant } from "../shared/app-constant";

@Injectable()
export class MlService {
    constructor(private expenseSvc: ExpenseService, private categorySvc: CategoryService) {

    } 

    async buildExpensesTrainingSet() {
        let expenses = await this.expenseSvc.findAll({ sync: true });
        //map it
        const model = expenses.map(async (e) => {
            const mapped = await this._prepare(e);
            return mapped;
        });
        const data = await Promise.all(model);

        const trainingSet = data.map((e) => {
            const catName = e["category"].name;
            const obj: brain.IRNNTrainingData = {
                input: e.description, 
                output: catName
            };
            return obj;
        });

        return trainingSet;
    }

    async trainExpenseCategoryMl() {
        // create configuration for training
        const config = {
            iterations: 20000,
            log: false,
            logPeriod: 50,
            layers: [10],
            learningRate: 0.6 //https://stackoverflow.com/a/27596780/859968
        };
        
        const data = await this.buildExpensesTrainingSet();

        const network = new brain.recurrent.LSTM();
        network.train(data, config);

        const json = network.toJSON();
        const jsonStr = JSON.stringify(json);
        
        fs.writeFileSync(`${AppConstant.UPLOADED_PATH_ML_WITH_FILE_NAME}`, jsonStr, 'utf8');
    }
        
    private _buildWordDictionary(trainingData) {
        const tokenisedArray = trainingData.map(item => {
            const tokens = item.phrase.split(' ')
            return tokens.map(token => natural.PorterStemmer.stem(token))
            // return tokens.map(token => token);
        });
            
        const flattenedArray = [].concat.apply([], tokenisedArray)
        return flattenedArray.filter((item, pos, self) => self.indexOf(item) == pos);
    }

    private async _prepare(exp: Expense) {
        let mExp = Object.assign({}, exp);
        return mExp;
    }   
}