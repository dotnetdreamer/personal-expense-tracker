import { Injectable } from "@angular/core";

import * as brain from 'brain.js';
import { ExpenseService } from '../../expense/expense.service';

@Injectable({
    providedIn: 'root'
})
//https://tech.holidayextras.com/build-a-phrase-classifier-with-javascript-b6d4821de447
//https://github.com/TomVance/simple_phrase_classifier
export class MlService {
    constructor(private expenseSvc: ExpenseService) {

    }

    async predictCategoryForExpenses(text) {
        const data = await this.expenseSvc.getExpenseListLocal();
        //TODO: go online...if there is no data local

        const TrainingSet = data.map((e) => {
            const catName = e.category.name;
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

    private _buildWordDictionary (trainingData) {
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
}