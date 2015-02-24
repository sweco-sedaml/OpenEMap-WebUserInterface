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
 * 
 */
Ext.define('OpenEMap.view.layer.Tree' ,{
    extend: 'Ext.tree.Panel',
    requires: [
        'OpenEMap.data.GroupedLayerTree',
        'GeoExt.tree.Column'
    ],

    rootVisible: false,
    hideHeaders: true,

    initComponent: function() {
        if(!this.store && this.mapPanel) {
            this.store = Ext.create('OpenEMap.data.GroupedLayerTree', {
                root: {
                    text: (this.mapPanel.config && this.mapPanel.config.name ? this.mapPanel.config.name : 'Lager'),
                    expanded: true,
                    isGroupLayer: true,
                    layers: this.mapPanel.map.layerSwitcherLayerTree
                },
                map: this.mapPanel.map
            });
        }

        this.on('checkchange', function(node, checked, eOpts) {
            var parent = node.parentNode;
        
            // Loop this node and children
            node.cascadeBy(function(n){
                n.set('checked', checked);
                var olLayerRef = n.get('layer');
                // Change layer visibility (Layer groups have no layer reference)
                if(olLayerRef) {
                    olLayerRef.setVisibility(checked);
                }

           });
            // Checking/unchecking parent node
            if (checked) {
                // check parent if not root
                if (!parent.isRoot()) {
                    parent.set('checked', checked);
                }
            } else {
                if (!parent.isRoot() && !parent.childNodes.some(function(node) { return node.get('checked'); })) {
                    parent.set('checked', checked);
                }
            }

        });

        this.on('cellclick', function(tree, td, cellIndex, node, el, columnIndex, e) {
            if (Ext.get(e.browserEvent.target).hasCls('legendimg')) {
                // create inline legend
                var layer = node.raw.layer;
                if (layer) {
                    var url;
                    if (node.raw.legendURL !== undefined) {
                        url = layer.legendURL;
                    } else if (node.raw.wms && node.raw.wms.params.LAYERS) {
                        var layerRecord = GeoExt.data.LayerModel.createFromLayer(layer);
                        var legend = Ext.create('GeoExt.container.WmsLegend', {
                            layerRecord: layerRecord
                        });
                        url = legend.getLegendUrl(node.raw.wms.params.LAYERS);
                    }
                    if (url && url.length > 0) {
                        var html = '<div><img src="' + url + '"></div>';
                        var tip = Ext.create('Ext.tip.ToolTip', {
                            //target: el,
                            //anchorToTarget: true,
                            title: 'Legend',
                            closable: true,
                            html: html
                        });
                        tip.showBy(el);
                    }
                }
            }
        });
        
        this.callParent(arguments);
    },
    
    getConfig: function(includeLayerRef) {
    	// Start with initial config to get a complete config object
        var config = Ext.clone(this.client.initialConfig);
        
        // Get layers config from layer tree, to reflect changes made by user   
       	var layers = this.getStore().getLayerConfiguration(includeLayerRef);

        // layer tree does not include base layers so extract them from initial config
    	var baseLayers = config.layers.filter(function(layer) {
    		return (layer.wms && layer.wms.options.isBaseLayer) ? layer : false;
    	});
    	config.layers = baseLayers.concat(layers);
    	
    	return config;
    }
});
