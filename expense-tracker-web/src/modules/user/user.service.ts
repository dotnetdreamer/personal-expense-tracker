import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindConditions } from "typeorm";

import * as moment from 'moment';
import * as bcrypt from 'bcrypt';

import { IRegistrationParams, UserRole, UserStatus } from "./user.model";
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

    async getUserByEmail(email, status = UserStatus.Approved, isDeleted = false) {
        const user = await this._findByEmail(email, status, isDeleted);
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

    async register(user: IRegistrationParams): Promise<{ data?, status? }> {
        let result = {
            userStatus: null,
            alreadyExist: false,
            alreadyRegisteredWwithNormalAuth: false
        };
        //validate, fetch all by status
        let existingUser = await this._findByEmail(user.email, null);
        if(!user.externalAuth) {
            if(existingUser) {
                result.alreadyExist = true;
            }

            if(existingUser.status != UserStatus.Approved) {
                result.userStatus = existingUser.status;
            }
        }

        if(result.userStatus || result.alreadyExist) {
            return { status: result };
        }

        let eAuth = await this.externalAuthSvc.findByEmail(user.email);
        //user is registered normally, can't be registered again using external auth
        if(existingUser && user.externalAuth && !eAuth) {
            result.alreadyRegisteredWwithNormalAuth = true;
            return { status: result };
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

            //default 
            newOrUpdated.role = UserRole.User;
            newOrUpdated.status = UserStatus.Pending;

            //first user is Admin
            const hasUsers = await this.userRepo.count();
            if(!hasUsers) {
                newOrUpdated.role = UserRole.Admin;
                newOrUpdated.status = UserStatus.Approved;
            }

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

    private _findByEmail(email, status: UserStatus | null = UserStatus.Approved
        , isDeleted: boolean | null = false) {
        const conditions: FindConditions<User> = { email: email };
        if(status != null) {
            conditions.status = <any>status;
        }

        if(isDeleted != null) {
            conditions.isDeleted = isDeleted;
        }

        return this.userRepo.findOne(conditions);
    }

    private _prepareUser(user: User) {
        const { password, isDeleted, createdOn, updatedOn, ...result } = user;
        return result;
    }
}