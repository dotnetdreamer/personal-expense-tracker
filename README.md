<p align="center">
# Xpensive - In Actvie Development
</p>
<p align="center">
  <a href="#" target="blank"><img src="/_docs/logo.png" width="120" alt="Xpensive Logo" /></a>
</p>
<p align="center">
An open source personal expense💰 tracker that lets you log your expenses.
</p>

## Screenshots
![Screenshots](/_docs/screenshots/background.png?raw=true "Optional Title")

### Why?
Pretty simple, why not?. I wanted to log my expenses under my control! so I created this. It runs everywhere (as a PWA) but you can run it as Hybrid app📱 also as it is built on top of [Capacitor](https://capacitor.ionicframework.com/), interact with [NestJs](https://nestjs.com/) APIs and is tested on Sqlite. Since NestJs usues TypeORM, it might work on other DBs as well.
- [Features](#features)
- [Quick Start](#quick-start)
- [Publishing](#publishing)
- [Contributing](#contributing)
- [Donation](#donation)
- [Licensing](#licensing)

## <a name="features"></a>Features

- Full Stack JS. One language to rule them all
- Works on cheap hosting (Only requires Node.js and Disk storage (which is very cheap))
- Personal expenses
- Group Expenses
- Share expenses with group members
- Dashboard & Charts
- All of the above + you own it


# <a name="quick-start"></a>Quick Start
1. Clone this repository
2. Switch to master branch
3. Navigate to i.e **expense-tracker-mobile** directory and run `npm i`.
4. For Google SignIn, go to **expense-tracker-mobile/src/app/modules/shared/app-constant.ts** and change the value of `GOOGLE_SIGNIN_CLIENT_ID` constant.
5. Now navigate to **expense-tracker-web** and run `npm i`
6. Navigate to **expense-tracker-web** directory (if not already) and run `npm run start:dev`
7. Open another command line and navigate to **expense-tracker-mobile** and run ionic serve
8. Mobile and Web projects are good to go!

# <a name="publishing"></a>Publishing
## Web/PWA
1. Navigate to **expense-tracker-mobile** and run `ionic build`. It will copy everything to `www` folder.
2. Copy `www` folder and upload it to server
3. Navigate to **expense-tracker-web** and run `npm run build`. It will generate build in `dist` folder.
4. Copy `package.json` from **expense-tracker-web** to `dist` folder and upload everything. Run on server `npm i` and make environment to **production**.

## Android (Coming Soon)

## iOS (Coming Soon)

# <a name="contributing"></a>Contributing
Any type of contribution is welcome!

# <a name="donation"></a>Donation
A donation will not make me rich, but your appreciation makes me happy 😁

[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=GCL2WCBZKKWBC)

# <a name="licensing"></a>License

Personal Tracker is open-sourced software licensed under the [Apache 2.0 license](LICENSE).
