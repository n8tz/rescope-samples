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

import React            from 'react';
import Rnd              from 'react-rnd';
import shortid          from 'shortid';
import AppScope         from './AppScope';
import {
	Store, reScope, scopeRef, scopeToProps, scopeToState, propsToScope, Scope, spells
}                       from "rscopes";
import {renderToString} from "react-dom/server"

import superagent from "superagent";

let { asStateMap } = spells;

import "weather-icons/css/weather-icons.css"
import "./App.scss"

var indexTpl = require('./index.html.tpl');
let ReactDom = require('react-dom');

@scopeToState(["appState", "someData"])
class App extends React.Component {
	static renderTo  = ( node ) => {
		let cScope      = new Scope(AppScope, { id: "App" });
		window.contexts = Scope.scopes;
		window.__scopesState && cScope.restore(window.__scopesState)
		cScope.mount(["appState", "someData"])
		      .then(
			      ( state ) => {
				      ReactDom.render(<App __scope={ cScope }/>, node);
			      }
		      )
	}
	static renderSSR = ( cfg, cb ) => {
		let rid    = shortid.generate(),
		    cScope = new Scope(AppScope, { id: rid });
		cfg.state && cScope.restore(cfg.state, { alias: "App" })
		//console.log(cfg)
		cScope.mount(["appState", "someData"])
		      .then(
			      ( state ) => {
				      let html;
				      try {
					      html = indexTpl.render(
						      {
							      app  : renderToString(<App __scope={ cScope }/>),
							      state: JSON.stringify(cScope.serialize({ alias: "App" }))
						      }
					      );
				      } catch ( e ) {
					      return cb(e)
				      }
				      cb(null, html)
			      }
		      )
	}
	
	render() {
		let {
			    someData, appState
		    } = this.state;
		return [
			<h1>Really basic drafty rescope SSR example</h1>,
			someData.items.map(
				note => <PostIt key={ note._id } record={ note }
				                onSelect={ e => this.$actions.selectPostIt(note._id) }
				                selected={ note._id == appState.selectedPostItId }/>
			),
			<div
				className={ "newBtn button" }
				onClick={ this.$actions.newPostIt }>
				Add Post It
			</div>,
			<div
				className={ "saveBtn button" }
				onClick={ this.$actions.saveState }>
				Save state
			</div>
		];
	}
}

// remap record for fun (not usefull here)
@reScope(
	{
		@asStateMap
		DaSearch: {
			src: "http://api.openweathermap.org/data/2.5/weather?&APPID=ecff7b21b7305a6f88ca6c9bc4f07027&q=",
			
			updateSearch( searching ) {
				let state = this.nextState, results = {};
				
				if ( searching == state.searching ) return;
				if ( searching.length < 4 )
					return { searching };
				
				this.wait();
				superagent.get(state.src + searching)
				          .then(( res ) => {
					          if ( searching != this.nextState.searching ) return;
					          try {
						          this.push({ results: res.body })
					          } catch ( e ) {
						          this.push({ results: null });
					          }
					          this.release();
				          })
				return { searching };
			}
		}
		
		
	}, { key: 'postIt' }
)
@scopeToProps(
	{
		@scopeRef
		DaSearch: "DaSearch"
	})
class PostIt extends React.Component {
	
	state = {};
	
	saveState = ( e, d ) => {
		let { $actions, record } = this.props;
		$actions.updatePostIt(
			{
				...record,
				size    : this.state.size || record.size,
				position: this.state.position
			});
	};
	
	render() {
		let {
			    record: { position, text, size } = {},
			    record, DaSearch,
			    $actions, onSelect, selected
		    }     = this.props,
		    state = this.state;
		return (
			<Rnd
				absolutePos
				z={ selected ? 2000 : 1 }
				size={ state.size || size }
				position={ state.position || position }
				onDragStop={ this.saveState }
				onResizeStop={ this.saveState }
				onDrag={ ( e, d ) => {
					!selected && onSelect(record)
					this.setState(
						{
							position: { x: d.x, y: d.y }
						});
				} }
				onResize={ ( e, direction, ref, delta, position ) => {
					this.setState(
						{
							position,
							size: {
								width : ref.offsetWidth,
								height: ref.offsetHeight
							}
						});
				} }>
				<div className={ "postit handle" }>
					{
						!this.state.editing &&
						<div className={ "text" }>
							<pre>{ JSON.stringify(DaSearch.results, null, 2) }</pre>
							<button onClick={ e => this.setState({ editing: true }) }
							        className={ "edit" }>🖋
							</button>
							<button onClick={ e => $actions.rmPostIt(record) }
							        className={ "delete" }>🖾
							</button>
						</div>
						||
						<div className={ "editor" }>
							{
								<div className={ "search" }>
									<input
										onChange={ e => {
											$actions.updateSearch(e.target.value);
										} }
										defaultValue={ DaSearch.searching }
										onMouseDown={ e => e.stopPropagation() }/>
								</div>
							}
							<button
								onClick={ e => this.setState({ editing: false }) }>💾
							</button>
						</div>
					}
				</div>
			</Rnd>
		);
	}
}

if ( typeof window != 'undefined' ) {
	window.App = App;
}
export default App