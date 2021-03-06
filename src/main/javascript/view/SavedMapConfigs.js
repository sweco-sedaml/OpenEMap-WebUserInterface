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
 * @class OpenEMap.view.SavedMapConfigs
 */
Ext.define('OpenEMap.view.SavedMapConfigs' ,{
    extend: 'Ext.grid.Panel',
    requires: ['OpenEMap.data.SavedMapConfigs'],
    autoScroll: true,
    hideHeaders: true,

    id: 'savedMapConfigsGrid',

    constructor: function() {
	    this.store = Ext.create('OpenEMap.data.SavedMapConfigs');
        this.columns = [
            { 
            	header: 'Name',  
            	dataIndex: 'name',
            	flex: 1,
                tooltip: 'Ladda',
                renderer: function(value, metadata, record) {
                	metadata.tdAttr = 'data-qtip="Ladda karta"';
                	return value;
                },
			    listeners: {
		            click: function(grid, rowIndex, cellIndex, column, e, record, tr) {
						var requestUrl = ((OpenEMap && OpenEMap.wsUrls && OpenEMap.wsUrls.basePath) ? OpenEMap.wsUrls.basePath : '') + 
							((OpenEMap && OpenEMap.wsUrls && OpenEMap.wsUrls.configs) ? OpenEMap.wsUrls.configs : '') + 
							'/config/' + record.get('configId');
						Ext.Ajax.request({
							scope: this,
							url: requestUrl,
							success: function(response) {
								this.client.destroy();
								this.client.configure(JSON.parse(response.responseText), this.client.initialOptions);
								e.stopEvent();
								return false;
							},
							failure: function(response) {
								Ext.MessageBox.alert('Kommunikationsproblem', 'Kartan kan inte öppnas. Kontakta systemadministratör.');
							}
						});
	               }.bind(this)
			    }
            },
            {
                xtype: 'actioncolumn',
                width: 40,
                getClass: function(value, meta) {
			    	return meta.record.get('isPublic') ? 'action-none' : 'action-remove';
	    		},
                tooltip: 'Ta bort',
                handler: function(grid, rowIndex, cellIndex, column, e, record, tr) {
                    //TODO! change to proper rest store delete
                    if (record.get('isPublic')) {
                    	return false;
                    }
                    
                    Ext.MessageBox.confirm('Ta bort', 'Vill du verkligen ta bort konfigurationen?', function(btn) {
                        if(btn === 'yes') {
                            var store = grid.getStore();
                            grid.panel.dataHandler.deleteConfiguration(record.get('configId'),{ configId: record.get('configId') });
                            store.removeAt(rowIndex);
                        }
                    });
                    e.stopEvent();
                    return false;
                }
            }
        ];
    
    	this.callParent(arguments);
    }
});
