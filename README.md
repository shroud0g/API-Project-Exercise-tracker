# Exercise Tracker REST API

#### A microservice project

Live website: https://flawless-stove.glitch.me/

Create user: `POST /api/exercise/new-user`

Add exercises: `POST /api/exercise/add`

GET exercise log: `/api/exercise/log?{userId}[&from][&to][&limit]`

Example: https://flawless-stove.glitch.me/api/exercise/log?userId=8nTYHs0Mi&to=2018&from=2016&limit=2

{ } = required, [ ] = optional

from, to = dates (yyyy-mm-dd); limit = number
