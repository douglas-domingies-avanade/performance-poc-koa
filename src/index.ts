import * as Router from 'koa-router';
import * as Koa from 'koa';
import * as bodyParser from "koa-bodyparser";
import Users from './repositories/users';
const app = new Koa();
app.use(bodyParser({  }));

const { PORT = 8003 } = process.env;


const router = new Router<Koa.DefaultState, Koa.DefaultContext>({});
new Users().attachCRUDRoutes(router);
app.use((ctx, next) => {
    //console.log(ctx);
    Object.assign(ctx.res, {
        send: function (content) { ctx.body = content; },
        status: function (status: number) { ctx.res.statusCode = status; return ctx.res; }
    });
    next();
});
app.use(router.routes());
// response
app.use(ctx => {
    const { req, res } = ctx;
    //console.log(ctx);
    ctx.body = 'OK';
});

app.listen(PORT, () => {
    console.log('We are live on port:', PORT);
});


