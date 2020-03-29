import { Injectable } from "@nestjs/common";

import * as brain from 'brain.js';

import { ExpenseService } from "src/modules/expense/expense.service";
import { CategoryService } from "src/modules/category/category.service";
import { Expense } from "src/modules/expense/expense.entity";

@Injectable()
export class MlService {
    constructor(private expenseSvc: ExpenseService, private categorySvc: CategoryService) {

    } 
    async buildAndTrainExpenses(text: string) {
        //TODO: limit the data by date
        let expenses = await this.expenseSvc.findAll();
        //map it
        const model = expenses.map(async (e) => {
            const mapped = await this._prepare(e);
            return mapped;
        });
        const data = await Promise.all(model);

        const TrainingSet = data.map((e) => {
            const catName = e["category"].name;
            const obj = {
              phrase: e.description, 
              result: { }
            };
            obj.result[catName] = 1;
            return obj;
        });
        const dictionary = this._buildWordDictionary(TrainingSet);

        const encodedTrainingSet = TrainingSet.map(dataSet => {
            const encodedValue = this._encode(dictionary, dataSet.phrase)
            return { input: encodedValue, output: dataSet.result }
        });

        const network = new brain.NeuralNetwork();
        network.train(encodedTrainingSet);
        
        const encoded = this._encode(dictionary, text)
        return network.run(encoded);
    }
        
    private _buildWordDictionary(trainingData) {
        const tokenisedArray = trainingData.map(item => {
            const tokens = item.phrase.split(' ')
            // return tokens.map(token => natural.PorterStemmer.stem(token))
            return tokens.map(token => token);
        });
            
        const flattenedArray = [].concat.apply([], tokenisedArray)
        return flattenedArray.filter((item, pos, self) => self.indexOf(item) == pos);
    }

    
    private _encode(dictionary, phrase) {
        const phraseTokens = phrase.split(' ')
        const encodedPhrase = dictionary.map(word => phraseTokens.includes(word) ? 1 : 0)

        return encodedPhrase
    }

    private async _prepare(exp: Expense) {
        let mExp = Object.assign({}, exp);
        
        //category
        const category = await this.categorySvc.findOne(mExp.categoryId);
        mExp["category"] = category;

        return mExp;
    }   
}