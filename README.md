# RIFGO - open source platform for educational creators

Hi everyone!

We founded **[RIFGO](https://www.crunchbase.com/organization/rifgo)** in July 2021 and closed it in May 2022. Here we describe our ideas, solutions and insights that you can use in your own projects as open source.

## Idea

The creator economy is a fast-growing market thanks to the [fourth industrial revolution](https://en.wikipedia.org/wiki/Fourth_Industrial_Revolution), which began in the 21st century. In this technological shift, the creative class of people is becoming the main value-added resource (everyone else will be automated by robots and artificial intelligence). We decided to create tools for creators to help them be more successful, work directly with clients and earn more money without intermediaries (schools, universities, agencies, HR departments and other administrators).

## Solutions

We've created three tools that you can use as open source:

1. Live streaming platform with features for selling sessions, online courses, and other products
2. Link-in-bio website builder (aka LinkTree) with event calendar
3. Referral service for coaches, which helps to sell more classes and timely reward to loyal clients
- Code base (open source)
  - [API](https://github.com/OpenRifgo/RifgoApi)
  - [SPA](https://github.com/OpenRifgo/RifgoSpa)
- [Design](https://www.figma.com/community/file/1129468239769594374) (open source)

We have made more than 120 deep custdev interviews with educational creators in the US, Canada, UK, Australia and New Zealand. This helped us to understand their business processes and pain points better. To that end, we've compiled databases of creators in these countries (updated February 2022). You can use them for your own purposes:

- [Clients databases](https://drive.google.com/drive/folders/1L4qwsTkadeNWT1WuTYjbmvVs_i-3dXjl?usp=sharing) (.xls)

## Insights

- The main challenges for creators are finding new customers or increasing the average check. In the first case, you will be competing with social media and word of mouth, in the second - with their ability to learn and motivation.
- Creators usually work alone and don't have time for complicated solutions. Create "two-button" pages if possible
- Creators are smart people in their field, but they usually understand nothing about sales. Often they simply repeat after another creator whom they believe. Thus, user cases are best for marketing
- You need to rise enough investment for at least three attempts to find a product-market fit (100 users for b2c, 30 for SMB, and 7 for Enterprise for proof). Otherwise, the chances of success for your startup tend to zero

## Conclusion

We were unable to attract a new round because of a lack of traction and a change in the life and business plans of the team due to the [war between Russia and Ukraine](https://en.wikipedia.org/wiki/2022_Russian_invasion_of_Ukraine). We had to close the company, but we still believe in the creator economy market and the tools for it. Please use our data in your solutions and feel free to ask us anything.

**We thank everyone for believing in our team and our ideas. Thank you for your help and your time!**

### Teammates

[Alex Vasilyuk](https://www.linkedin.com/in/alexander-vasilyuk-59b48922) - senior customer success

[Andrew Ilingin](https://www.linkedin.com/in/ilingin-andrew-8895694a) - co-founder and CEO

[Artem Samilo](https://www.linkedin.com/in/artem-samilo) - senior data scrapper

[Kirill Kalinyuk](https://www.linkedin.com/in/kir-kalin-0b07199b) - co-founder and COO

[Kirill Makarov](https://www.facebook.com/makarovkirilldesign) - senior UX designer

[Max Mostovoy](https://www.linkedin.com/in/maximmostovoy) - co-founder and CPO

[Roman Exempliarov](https://www.linkedin.com/in/roman-exemplarov) - co-founder and CTO

[Svyatoslav Galygin](http://www.linkedin.com/in/svatdeve) - senior frontend developer

### Investors

[Sergey Chetverikov](https://www.crunchbase.com/person/sergey-chetverikov) - angel investor

[Angelsdeck](https://www.crunchbase.com/organization/angelsdeck) - angel investor club

RIFGO team

# RIFGO - Backend / API

Built with [Fastify](https://www.fastify.io/) and [TypeORM](https://typeorm.io/)

## Install the dependencies
```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
yarn run dev
```

### Run the app in production mode
```bash
yarn run start
```
