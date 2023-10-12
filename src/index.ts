import * as express from "express"
import * as bodyParser from "body-parser"
import { query, validationResult } from 'express-validator';
import { Request, Response } from "express"
import { AppDataSource } from "./data-source"
import { Routes } from "./routes"
import * as morgan from 'morgan'

import { port } from './config'

function handleError(err, req, res, next) {
    res.status(err.statusCode || 500).send({ message: err.message });
}

AppDataSource.initialize().then(async () => {

    // create express app
    const app = express()
    app.use(morgan('tiny'))
    app.use(bodyParser.json())

    // register express routes from defined application routes
    Routes.forEach(route => {
        (app as any)[route.method](route.route,
            ...route.validation,
            async (req: Request, res: Response, next: Function) => {
                try {
                    const error = validationResult(req);
                    if (!error.isEmpty()) {
                        return res.status(400).json({ erros: error.array() })
                    }


                    const result = await (new (route.controller as any))[route.action](req, res, next)
                    res.json(result);
                } catch (error) {
                    next(error);
                }
            })
    })

    app.use(handleError)
    app.listen(port)

    console.log(`Express server has started on port ${port}`)

}).catch(error => console.log(error))
