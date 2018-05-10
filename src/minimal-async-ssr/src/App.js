/*
 * Copyright (c)  2018 Wise Wild Web .
 *
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *
 * @author : Nathanael Braun
 * @contact : caipilabs@gmail.com
 */

import "react-rescope";
import AppScope           from './AppScope';
import {
    Store, reScope, scopeRef, scopeToProps, scopeToState, propsToScope, Scope
}                         from "rescope";
import { renderToString } from "react-dom/server"

import "./App.scss"

var indexTpl = require('./index.html.tpl');
let ReactDom = require('react-dom');


class App {
    static renderTo  = ( node ) => {
        let cScope = new Scope(AppScope, { id: "App" });
        window.__scopesState && cScope.restore(window.__scopesState)
        cScope.mount([ "Home" ])
              .then(
                  ( { Home } ) => {
                      ReactDom.render(<Home/>, node);
                  }
              )
    }
    static renderSSR = ( cfg, cb ) => {
        //let cScope = new Scope(AppScope, { id: "App" });
        //cfg.state && cScope.restore(cfg.state)
        //cScope.mount([ "Home" ])
        //      .then(
        //          ( state ) => {
        let html;
        try {
            html = indexTpl.render(
                {
                    //app  : renderToString(<Home/>),
                    //state: JSON.stringify(cfg.state || cScope.serialize({ alias: "App"
                    // }))
                }
            );
        } catch ( e ) {
            return cb(e)
        }
        cb(null, html)
        //}
        //)
    }
}

if ( typeof window != 'undefined' ) {
    window.App = App;
}
export default App