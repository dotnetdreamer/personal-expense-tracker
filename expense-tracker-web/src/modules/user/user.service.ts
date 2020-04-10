import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import * as moment from 'moment';
import * as bcrypt from 'bcrypt';

import { IRegistrationParams } from "./user.model";
import { User } from "./user.entity";
import { AppConstant } from "../shared/app-constant";
import { ExternalAuthService } from "./external-auth/external-auth.service";
import { HelperService } from "../shared/helper.service";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private externalAuthSvc: ExternalAuthService, private helperSvc: HelperService
    ) {}

    async getUserByEmail(email) {
        const user = await this._findByEmail(email);
        if(!user) {
            return null;
        }

        return this._prepareUser(user);
    }

    async validateUser(args: { email, password }): Promise<any> {
        const user = await this._findByEmail(args.email);
        if(!user) {
            return null;
        }

        const match = await bcrypt.compare(args.password, user.password);
        if (match) {
            return this._prepareUser(user);
        }

        return null;
    }

    async register(user: IRegistrationParams): Promise<{ data?, message? }> {
        //validate
        let existingUser = await this._findByEmail(user.email);
        if(existingUser && !user.externalAuth) {
            return { message: 'User already exist' };
        } 

        let eAuth = await this.externalAuthSvc.findByEmail(user.email);
        //user is registered normally, can't be registered again using external auth
        if(existingUser && user.externalAuth && !eAuth) {
            return { message: 'User already registered using normal authentication' };
        }
        
        if(!existingUser) {
            let newOrUpdated: any = Object.assign({}, user);
            if(typeof newOrUpdated.isDeleted === 'undefined') {
                newOrUpdated.isDeleted = false;
            }

            if(typeof newOrUpdated.createdOn === 'undefined') {
                newOrUpdated.createdOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }

            let password = newOrUpdated.password;
            //incase of externalAuth, password will be null
            if(!password) {
                password = this.helperSvc.getRandomNumber();
            } 
            //Fix: Error: data must be a string and salt must either be a salt string or a number of rounds
            password = password.toString();

            //password
            const hasPassword = await bcrypt.hash(password, AppConstant.DEFAULT_PASSWORD_SALT_ROUNDS);
            newOrUpdated.password = hasPassword;

            //now save
            existingUser = <any>await this.userRepo.save<User>(newOrUpdated);
        }

        //external auth
        if(user.externalAuth) {
            if(eAuth) {
                //update
                eAuth.externalIdentifier = user.externalAuth.externalIdentifier;
            } else {
                //create
                eAuth = {
                    email: user.externalAuth.email,
                    externalIdentifier: user.externalAuth.externalIdentifier,
                    providerSystemName: user.externalAuth.providerSystemName,
                    id: undefined,
                    userId: existingUser.id
                };
            }
            await this.externalAuthSvc.save(eAuth);
        }

        const pareparedUser = this._prepareUser(<any>existingUser);
        return { data: pareparedUser };
    }

    private _findByEmail(email) {
        return this.userRepo.findOne({ email: email });
    }

    private _prepareUser(user: User) {
        const { password, isDeleted, createdOn, updatedOn, id, ...result } = user;
        return result;
    }
}