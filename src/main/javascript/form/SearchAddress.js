﻿/*    
    Copyright (C) 2014 Härnösands kommun

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
 * Combobox that searches from LM with type ahead.
 */
Ext.define('OpenEMap.form.SearchAddress', {
    extend : 'Ext.form.field.ComboBox',
    alias: 'widget.searchaddress',
    require: ['Ext.data.*',
              'Ext.form.*'],
    emptyText: 'Sök adress...',
    selectOnFocus: true,
    minChars: 3,
    labelWidth: 60,
    displayField: 'name',
    valueField: 'id',
    queryParam: 'q',
    typeAhead: true,
    forceSelection: true,
    msgTarget: 'under',
    initComponent : function() {
        var registeromrade;
        var zoom = 5;
        if (this.search && this.search.options){
            registeromrade = this.search.options.municipalities.join(',');
            zoom = this.search.options.zoom;
        }
        var layer = this.mapPanel.searchLayer;
        
        function doSearch(fnr, x, y) {
            this.mapPanel.setLoading(true);
            this.mapPanel.searchLayer.destroyFeatures();
            OpenEMap.requestLM({
                url: 'registerenheter?fnr=' + fnr,
                success: function(response) {
                    var json = Ext.decode(response.responseText);
                    if (json.success === false) {
                        Ext.Msg.alert('Meddelande', 'Ingen fastighet kunde hittas på adressen.');
                        return;
                    }
                    this.resultPanel.expand();
                    var features = new OpenLayers.Format.GeoJSON().read(response.responseText, "FeatureCollection");
                    layer.addFeatures(features);
                    var point = new OpenLayers.Geometry.Point(x, y);
                    feature = new OpenLayers.Feature.Vector(point);
                    layer.addFeatures([feature]);
                    this.mapPanel.map.setCenter([x,y], zoom);
                },
                failure: function() {
                    Ext.Msg.alert('Fel', 'Okänt.');
                },
                callback: function() {
                    this.mapPanel.setLoading(false);
                },
                scope: this
            });
        }
        
        this.store = Ext.create('Ext.data.Store', {
            proxy: {
                type: 'ajax',
                url : OpenEMap.basePathLM + 'addresses',
                extraParams: {
                    lmuser: OpenEMap.lmUser
                },
                reader: {
                    type: 'array'
                }
            },
            fields: ['id', 'name', 'x', 'y', 'fnr']
        });
        
        this.store.on('beforeload', function(store, operation) {
          store.lastOperation = operation;
        }, this);
        
        this.store.on('load', function(store, records, successful, eOpts) {
         		if (successful) {
         			if (store.count() === 0) { 
         				this.setActiveError('Sökningen gav inga träffar');
         				this.doComponentLayout();
         			}
         		} else {
         			this.setActiveError('Söktjänsten fungerar inte');
       				this.doComponentLayout();
         		}
         	}, 
         	this 
     	);

	    this.clearSearchString = function(e,el,panel) {
	    	if (typeof panel === "undefined") {
	    		panel = this;
	    	}
	    	
		    panel.clearValue();
		    panel.collapse();
			layer.destroyFeatures();
			panel.focus();
	    };

        this.listeners = {
            'select':  function(combo, records) {
                doSearch.call(this, records[0].data.fnr, records[0].data.x, records[0].data.y);
            },
            'beforequery': function(queryPlan) {
            	if (queryPlan.query.length < this.minChars) {
            		queryPlan.cancel = true;
            	} else {
	                if (registeromrade && queryPlan.query.match(registeromrade) === null) {
	                    queryPlan.query = registeromrade + ' ' + queryPlan.query;
	                }
	
			        if (this.store.loading && this.store.lastOperation) {
			          var requests = Ext.Ajax.requests;
			          for (var id in requests)
			            if (requests.hasOwnProperty(id) && requests[id].options == this.store.lastOperation.request) {
			              Ext.Ajax.abort(requests[id]);
			            }
			        }
			    }
            },
            scope: this
        };

        // Drop down arrow replaced by reset button 
	    this.trigger1Cls = 'x-form-clear-trigger';
	    this.onTrigger1Click = this.clearSearchString;
        
        this.callParent(arguments);
    }
});
