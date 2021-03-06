
import Metadata from "./Metadata";

import Link from "./Link";

import {
    GET,
    POST
} from "../network";

var {createLink} = Link;

class Identifier {
    constructor(name, metadata) {
        this.name = name;
        this.metadata = new Metadata(metadata);
    }

    links() {
        return Link.getLinksForIdentifier(this);
    }

    neighbours() {
        var links = this.links(),
            identifiersArray = [].concat.apply([], links.map((link) => link.identifiers())),
            identifiers = new Set(identifiersArray);

        identifiers.delete(this);
        return [...identifiers.values()];
    }

    search({match_metadata, results_filter, match_terminal, match_links, max_depth=1, traversal="depth"}) {
        //params = {
        //    "max_depth":1,
        //    "traversal":"depth",
        //    //"max_size":100,
        //    //"match_metadata":{
        //    //    "type":"IPV4"
        //    //},
        //    //"match_links":{
        //    //    "type": ["IP-MAC"]
        //    //},
        //    //"results_filter":["capabilities"],
        //    //"match_terminal":{
        //    //    "type":"device"
        //    //}
        //};

        var params = {
            max_depth,
            traversal
        };

        if (match_metadata && match_metadata.length > 0) {params.match_metadata = match_metadata}
        if (match_links && match_links.length > 0) {params.match_links = match_links}
        if (results_filter && results_filter.length > 0) {params.results_filter = results_filter}
        if (match_terminal && match_terminal.length > 0) {params.match_terminal = match_terminal}

        return POST(`/identifier/${encodeURIComponent(this.name)}/search`, params)
            .then((res) => {console.log(res); return res;})
            .then((res) => {
                return {
                    links: res.links.map(createLink),
                    identifiers: res.identifiers.map(createIdentifier)
                }
            });
    }
}

var identifiers = new Map();

function get(name) {
    return identifiers.get(name);
}

function createIdentifier(identifier) {
    var key = decodeURIComponent(identifier.identifier);

    if (!identifiers.has(key)) {
        identifiers.set(key, new Identifier(key, identifier.metadata));
    }
    return identifiers.get(key);
}

function handleError(error) {
    return Promise.reject(`Unable to find Identifier: ${error}`);
}

function find(name) {
    return GET(`/identifier/${encodeURIComponent(name)}`)
        .then(createIdentifier, handleError);
}

export default {
    createIdentifier,
    find,
    get,
    clear() {
        identifiers = new Map();
    }
}
