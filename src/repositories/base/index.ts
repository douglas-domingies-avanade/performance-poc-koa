import * as faker from 'faker';

var parse = function (originalUrl: string, urlFormat: string): any {
    //console.log(originalUrl, urlFormat);
    var keys = urlFormat.match(/:([^\/]+)/g);
    var rex = new RegExp('^' + urlFormat.replace(/\//g, '\\/').replace(/:([^\/]+)/g, '([^\/]+)'));
    var m = [].concat(originalUrl.match(rex)).slice(1);
    var params = {};
    for (let index = 0; index < keys.length; index++) {
        const value = m[index];
        if (typeof value === 'undefined') break;
        params[keys[index].substr(1)] = value;
    }
    return params;
}
export default abstract class BaseRepository<T> {
    private _parameters;
    private _crudAttached = false;
    protected constructor(parameters) {
        this._parameters = parameters;
        Object.seal(this._parameters);
    }
    get parameters() {
        return this._parameters;
    }
    abstract insert(data);
    abstract updateOne(id, data);
    abstract findAll();
    abstract findOne(id);
    abstract deleteAll();
    abstract deleteOne(id): { status: number };
    attachCRUDRoutes(app: any, route?: string) {
        if (this._crudAttached) throw new Error('Repository already attached!');
        app.post(route || this.parameters.route, ({ request: req, res }) => {
            if (req.header['x-random-name'] == '1') {
                req.body.nome = faker.name.firstName();
            }
            const result = this.insert(req.body);
            res.send({ id: result.insertedId });
            res.status(result.status)
        });
        app.get(`${route || this.parameters.route}/:id`, (ctx) => {
            const { res } = ctx;
            const params = parse(ctx.originalUrl, `${route || this.parameters.route}/:id`);
            const result = this.findOne(params.id);
            res[typeof res.json === 'function' ? 'json' : 'send'](result.data);
            res.status(result.status)
        });
        app.get(route || this.parameters.route, ({ res }) => {
            const result = this.findAll();
            res[typeof res.json === 'function' ? 'json' : 'send'](result.data);
            res.status(result.status)
        });
        app.put(`${route || this.parameters.route}/:id`, (ctx) => {
            const { req, res } = ctx;
            const params = parse(ctx.originalUrl, `${route || this.parameters.route}/:id`);
            const result = this.updateOne(params.id, req.body);
            res.send('');
            res.status(result.status)
        });
        app.delete(`${route || this.parameters.route}/:id`, (ctx) => {
            const { res } = ctx;
            const params = parse(ctx.originalUrl, `${route || this.parameters.route}/:id`);
            const result = this.deleteOne(params.id);
            res.send('');
            res.status(result.status)
        });
        return this;
    }
}

export class MemoryRepo<T> extends BaseRepository<T> {
    private _data = Array();
    private _byId = {};
    private _id = 1;
    constructor(parameters) {
        super(parameters)
        //super(parameters);

    }
    attachCRUDRoutes(app: any, route?: string | undefined): this {
        BaseRepository.prototype.attachCRUDRoutes.apply(this, [app, route]);
        return this;
    }
    insert(data) {
        data.id = this._id++;
        this._byId[data.id] = data;
        this._data.push(data);
        //console.log(this, data);
        return { status: 201, insertedId: data.id };
    }
    updateOne(id, data) {
        const _internal = this._byId[id];
        if (!_internal) {
            return { status: 404 };
        }
        const index = this._data.findIndex((u) => u.id === _internal.id);
        if (index === -1) {
            return { status: 404 };
        }
        delete data.id;
        Object.assign(this._byId[id], data);
        return { status: 204 }
    }
    findAll() {
        return { status: 200, data: this._data };
    }
    findOne(id) {
        const data = this._byId[id];
        if (!data) {
            return { status: 404 };
        }
        const index = this._data.findIndex((u) => u.id === data.id);
        if (index === -1) {
            return { status: 404 };
        }
        return { status: 200, data };
    }
    deleteAll() {
        this._data.splice(0, this._data.length);
        return { status: 204 };
    }
    deleteOne(id) {
        const _internal = this._byId[id];
        if (!_internal) {
            return { status: 404 };
        }
        const index = this._data.findIndex((u) => u.id === _internal.id);
        if (index === -1) {
            return { status: 404 };
        }
        delete this._byId[id];
        this._data.splice(index, 1);
        return { status: 204 };
    }
}