import { Injectable } from "@angular/core";

import * as brain from 'brain.js';
import { ExpenseService } from '../../expense/expense.service';
import { CategoryService } from '../../category/category.service';
import { ICategory } from '../../category/category.model';

@Injectable({
    providedIn: 'root'
})
//https://tech.holidayextras.com/build-a-phrase-classifier-with-javascript-b6d4821de447
//https://github.com/TomVance/simple_phrase_classifier
export class MlService {
    constructor(private expenseSvc: ExpenseService, private categorySvc: CategoryService) {

    }

    async predictCategoryForExpenses(text): Promise<{ category: ICategory, score: number }> {
        let expenses: any = await import('../../../../assets/expenses.json');
        const TrainingSet: any[] = expenses.default;

        //Important: use the following to train more data from server
        // const data = await this.expenseSvc.getExpenseListLocal();
        // const TrainingSet = data.map((e) => {
        //     const catName = e.category.name;
        //     const obj = {
        //       phrase: e.description, 
        //       result: { }
        //     }; 
        //     obj.result[catName] = 1;
        //     return obj;
        // });
        // console.log(JSON.stringify(TrainingSet));

        const dictionary = this._buildWordDictionary(TrainingSet);

        const encodedTrainingSet = TrainingSet.map(dataSet => {
            const encodedValue = this._encode(dictionary, dataSet.phrase)
            return { input: encodedValue, output: dataSet.result }
        });
        
        const network = new brain.NeuralNetwork();
        network.train(encodedTrainingSet);

        const encoded = this._encode(dictionary, text)
        const predictions = network.run(encoded);

        //sorted by prediction
        const sortedPred = Object.entries(predictions).sort((a, b) => a[1] - b[1]);

        //get the highest scored prediction
        const acceptedPrediction = sortedPred[sortedPred.length - 1];
        const predictedCategory = acceptedPrediction[0];

        //find category
        //TODO: fetch category name from local instead of all
        const categories = await this.categorySvc.getCategoryListLocal();
        const selectedCategory = categories.filter(c => c.name.toLowerCase().includes(predictedCategory.toLowerCase()))[0];

        return {
            category: selectedCategory,
            score: acceptedPrediction[1]
        };
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