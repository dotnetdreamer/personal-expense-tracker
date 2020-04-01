import { Injectable } from "@angular/core";

import * as brain from 'brain.js';
import { ExpenseService } from '../../expense/expense.service';
import { CategoryService } from '../../category/category.service';
import { ICategory } from '../../category/category.model';
import { BaseService } from '../base.service';

@Injectable({
    providedIn: 'root'
})
//https://tech.holidayextras.com/build-a-phrase-classifier-with-javascript-b6d4821de447
//https://github.com/TomVance/simple_phrase_classifier
export class MlService extends BaseService {

    constructor(private expenseSvc: ExpenseService, private categorySvc: CategoryService) {
        super();
    }

    async predictCategoryForExpenses(text): Promise<ICategory> {
        let netString: any = await import('../../../../assets/trained-net-category.json');
        let data = netString.default;

        const network = new brain.recurrent.LSTM();
        network.fromJSON(data);

        const predictedCategory = network.run<string>(text);

        // // //sorted by prediction
        // // const sortedPred = Object.entries(predictions).sort((a, b) => a[1] - b[1]);

        // // //get the highest scored prediction
        // // const acceptedPrediction = sortedPred[sortedPred.length - 1];
        // // const predictedCategory = acceptedPrediction[0];

        //find category
        //TODO: fetch category name from local instead of all
        const categories = await this.categorySvc.getCategoryListLocal();
        let selectedCategory: ICategory;
        if(predictedCategory) {
            selectedCategory = categories.filter(c => c.name.toLowerCase().includes(predictedCategory.toLowerCase()))[0];
        } else {
            //general
            // selectedCategory = categories.filter(c => c.groupName.toLowerCase() == 'general')[0];
        }

        return selectedCategory;
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