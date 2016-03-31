var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');
var Settings = require('settings');
var dict;
var splashWindowConf;

Pebble.addEventListener('showConfiguration', function(e) {
  // Show config page
  Pebble.openURL('https://www.activesoftswitch.com/Media/configurable2.html');
});

Pebble.addEventListener("webviewclosed", function(e) {
  console.log("configuration closed "  + e.response);
  // webview closed
  var options = JSON.parse(decodeURIComponent(e.response));
  console.log("Options = " + JSON.stringify(options));
  
  
  // Prepare AppMessage payload
  dict = {
    'LICENCE': options.licence,
    'STEMPRO': options.stemproOption,
  };

  
  Settings.data('settings.dict', dict);
  if(splashWindowConf)
  {
    splashWindowConf.hide();}
  
  // Send settings to Pebble watchapp
  Pebble.sendAppMessage(dict, function(){
    console.log('Sent config data to Pebble'); 
     console.log("Licence = " + dict.LICENCE);
  }, function() {
    console.log('Failed to send config data!');
  });
  
});

dict = Settings.data('settings.dict');




var mainmenuItems = [];
mainmenuItems.push({
    title: "Active Calls",
    subtitle: "Current Live Calls"
});
mainmenuItems.push({
    title: "Vendors",
    subtitle: "Listing Balances"
});
mainmenuItems.push({
    title: "STEM Pro",
    subtitle: "Last 10 Alerts"
});

// Construct Menu to show to user
var resultsMainMenu = new UI.Menu({
    sections: [{
        title: 'Active Calls',
        items: mainmenuItems
    }]
});

// Show the Menu, hide the splash
resultsMainMenu.show();


if (!dict)
 {
   
   console.log('dict is undefined!');
        // Show splash screen while waiting for data
        splashWindowConf = new UI.Window();

        // Text element to inform user
        var textConf = new UI.Text({
            position: new Vector2(0, 0),
            size: new Vector2(144, 168),
            text: 'Please Configure this app...',
            font: 'GOTHIC_28_BOLD',
            color: 'black',
            textOverflow: 'wrap',
            textAlign: 'center',
            backgroundColor: 'white'
        });

        // Add to splashWindow and show
        splashWindowConf.add(textConf);
        splashWindowConf.show();
 }

resultsMainMenu.on('select', function(e) {

//ACTIVECALLS////////////////////////////
  
    if (e.itemIndex === 0) {
        // Active Calls ////////////////////
        // Show splash screen while waiting for data
        var splashWindow = new UI.Window();

        // Text element to inform user
        var text = new UI.Text({
            position: new Vector2(0, 0),
            size: new Vector2(144, 168),
            text: 'Downloading Active Calls...',
            font: 'GOTHIC_28_BOLD',
            color: 'black',
            textOverflow: 'wrap',
            textAlign: 'center',
            backgroundColor: 'white'
        });

        // Add to splashWindow and show
        splashWindow.add(text);
        splashWindow.show();

        console.log("Licence = " + dict.LICENCE);
        var URL = 'https://api.activesoftswitch.com/GetActiveCallsEnvironment/' + dict.LICENCE + '?format=json';
      
        // Make the request
        ajax({
                url: URL,
                type: 'json'
            },
            function(data) {

                var parseFeed = function(data, quantity) {
                    var items = [];
                    for (var i = 0; i < quantity; i++) {
                        // Always upper case the description string
                        var title = data.lstActiveCalls[i].CLD;
                        title = title.charAt(0).toUpperCase() + title.substring(1);

                        // Get date/time substring
                        var time = data.lstActiveCalls[i].DurationMins;
                        
                      

                        // Add to menu items array
                        items.push({
                            title: title,
                            subtitle: time
                        });
                    }

                    // Finally return whole array
                    return items;
                };

                // Count number of active calls
                var aCount = data.lstActiveCalls.length;
                console.log('number of active calls: ' + aCount);

                var menuItems = [];

                if (aCount === 0) {
                    menuItems.push({
                        title: "No Active Calls",
                        subtitle: "shake to refresh"
                    });
                } else {
                    // Create an array of Menu items
                    menuItems = parseFeed(data, aCount);
                }

                // Check the items are extracted OK
                for (var i = 0; i < menuItems.length; i++) {
                    console.log(menuItems[i].title + ' | ' + menuItems[i].subtitle);
                }


                // Construct Menu to show to user
                var resultsMenu = new UI.Menu({
                    sections: [{
                        title: 'Active Calls',
                        items: menuItems
                    }]
                });

                // Show the Menu, hide the splash
                resultsMenu.show();
                splashWindow.hide();

                // Register for 'tap' events
                resultsMenu.on('accelTap', function(e) {

                    // Make another request to openweathermap.org
                    ajax({
                            url: URL,
                            type: 'json'
                        },
                        function(data) {

                            aCount = data.lstActiveCalls.length;
                            console.log('number of active calls: ' + aCount);

                            var newItems = [];

                            if (aCount === 0) {
                                newItems.push({
                                    title: "No Active Calls",
                                    subtitle: "shake to refresh"
                                });
                            } else {

                                // Create an array of Menu items
                                newItems = parseFeed(data, aCount);
                            }

                            // Update the Menu's first section
                            resultsMenu.items(0, newItems);


                            // Notify the user
                            Vibe.vibrate('short');
                        },
                        function(error) {
                            console.log('Download failed: ' + error);
                        }
                    );
                });

                if (aCount > 0) {
                    // Add an action for SELECT
                    resultsMenu.on('select', function(e) {

                        //Get DATA
                        var cli = data.lstActiveCalls[e.itemIndex].CLI;
                        var accountid = data.lstActiveCalls[e.itemIndex].AccountID;
                        var connecttimeRAW = data.lstActiveCalls[e.itemIndex].Connect_time;
                      
                      
                        console.log('Time RAW: ' + connecttimeRAW);
                        
                        var time = connecttimeRAW.substring(6, 27);
                      
                        var currentTime = new Date(parseInt(time));
                        
                        
                        console.log('Current Time: ' + currentTime);
                        var month = currentTime.getMonth() + 1;
                        var day = currentTime.getDate();
                        var fullyear = currentTime.getFullYear();
                        var year = fullyear - 2000;
                        var hour = currentTime.getHours();
                        var minute = currentTime.getMinutes();
                        var second = currentTime.getSeconds();
                        var connecttime = day + "/" + month + "/" + year + " " + hour + ":" + minute + ":" + second; 
                      
                      
                      
                        var content = 'CLD: ' + e.item.title + "\nCLI: " + cli + '\nID:' + accountid + '\nStart:' + connecttime;

                        // Create the Card for detailed view
                        var detailCard = new UI.Card({
                            title: 'Details',
                            subtitle: e.item.subtitle,
                            body: content
                        });
                        detailCard.show();
                    });
                }
            },


            function(error) {
                // Failure!
                console.log('Failed fetching ActiveCall logs ' + error);
            }
        );




    }

//VENDOR////////////////////////////
  
    if (e.itemIndex == 1) {
        // Active Calls ////////////////////
        // Show splash screen while waiting for data
        var splashWindowVendor = new UI.Window();

        // Text element to inform user
        var textVendor = new UI.Text({
            position: new Vector2(0, 0),
            size: new Vector2(144, 168),
            text: 'Downloading Vendor Balances...',
            font: 'GOTHIC_28_BOLD',
            color: 'black',
            textOverflow: 'wrap',
            textAlign: 'center',
            backgroundColor: 'white'
        });

        // Add to splashWindow and show
        splashWindowVendor.add(textVendor);
        splashWindowVendor.show();

        var URLvendor = 'https://api.activesoftswitch.com/GetPortaVendors/' + dict.LICENCE + '?format=json';

        // Make the request
        ajax({
                url: URLvendor,
                type: 'json'
            },
            function(data) {

                var parseFeed = function(data, quantity) {
                    var items = [];
                    for (var i = 0; i < quantity; i++) {
                        // Always upper case the description string
                        var title = data.EnvironmentVendors[i].Name;
                        title = title.charAt(0).toUpperCase() + title.substring(1);

                        // Get date/time substring
                        var balance = data.EnvironmentVendors[i].Balance;
                        
                      if (balance !== 0) {
                        // Add to menu items array
                        items.push({
                            title: title,
                            subtitle: 'Balance: ' + balance
                        });
                    }
                    }
                    // Finally return whole array
                    return items;
                };

                // Count number of active calls
                var aCount = data.EnvironmentVendors.length;
                console.log('number of Vendors: ' + aCount);

                var menuItems = [];

                if (aCount === 0) {
                    menuItems.push({
                        title: "No Vendors",
                        subtitle: "create vendors in Porta"
                    });
                } else {
                    // Create an array of Menu items
                    menuItems = parseFeed(data, aCount);
                }

                // Check the items are extracted OK
                for (var i = 0; i < menuItems.length; i++) {
                    console.log(menuItems[i].title + ' | ' + menuItems[i].subtitle);
                }


                // Construct Menu to show to user
                var resultsMenu = new UI.Menu({
                    sections: [{
                        title: 'Vendor Balances',
                        items: menuItems
                    }]
                });

                // Show the Menu, hide the splash
                resultsMenu.show();
                splashWindowVendor.hide();

                // Register for 'tap' events
                resultsMenu.on('accelTap', function(e) {

                    // Make another request to openweathermap.org
                    ajax({
                            url: URL,
                            type: 'json'
                        },
                        function(data) {

                            aCount = data.lstActiveCalls.length;
                            console.log('number of active calls: ' + aCount);

                            var newItems = [];

                            if (aCount === 0) {
                                newItems.push({
                                    title: "No Active Calls",
                                    subtitle: "shake to refresh"
                                });
                            } else {

                                // Create an array of Menu items
                                newItems = parseFeed(data, aCount);
                            }

                            // Update the Menu's first section
                            resultsMenu.items(0, newItems);


                            // Notify the user
                            Vibe.vibrate('short');
                        },
                        function(error) {
                            console.log('Download failed: ' + error);
                        }
                    );
                });

                if (aCount > 0) {
                    // Add an action for SELECT
                    resultsMenu.on('select', function(e) {

                        //Get DATA
                        var cli = data.lstActiveCalls[e.itemIndex].CLI;
                        var accountid = data.lstActiveCalls[e.itemIndex].AccountID;
                        var connecttime = data.lstActiveCalls[e.itemIndex].Connect_time;
                        var content = 'CLD: ' + e.item.title + "\nCLI: " + cli + '\nAccount ID:' + accountid + '\nConnect Time:' + connecttime;

                        // Create the Card for detailed view
                        var detailCard = new UI.Card({
                            title: 'Details',
                            subtitle: e.item.subtitle,
                            body: content
                        });
                        detailCard.show();
                    });
                }
            },

            function(error) {
                // Failure!
                console.log('Failed fetching Vendor Balances ' + error);
            }
        );
    }  
  
//STEMPRO////////////////////////////
  
    if (e.itemIndex == 2) {
        // Active Calls ////////////////////
        // Show splash screen while waiting for data
        var splashWindowSTEMPRO = new UI.Window();

        // Text element to inform user
        var textSTEMPRO = new UI.Text({
            position: new Vector2(0, 0),
            size: new Vector2(144, 168),
            text: 'Downloading STEM Pro Alerts...',
            font: 'GOTHIC_28_BOLD',
            color: 'black',
            textOverflow: 'wrap',
            textAlign: 'center',
            backgroundColor: 'white'
        });

        // Add to splashWindow and show
        splashWindowSTEMPRO.add(textSTEMPRO);
        splashWindowSTEMPRO.show();

         var URLstempro = 'https://api.activesoftswitch.com/GetLast10AlertedAccounts/' + dict.LICENCE + '?format=json';

        // Make the request
        ajax({
                url: URLstempro,
                type: 'json'
            },
            function(data) {

                var parseFeed = function(data, quantity) {
                    var items = [];
                    for (var i = 0; i < quantity; i++) {
                        // Always upper case the description string
                        var title = data.lstAlertedAccounts[i].CustomerName;
             

                        // Get date/time substring
                        var timeRAW = data.lstAlertedAccounts[i].AlertedTime;
                        console.log('Time RAW: ' + timeRAW);
                        
                        var time = timeRAW.substring(6, 27);
                      
                        var currentTime = new Date(parseInt(time));
                        
                        
                        console.log('Current Time: ' + currentTime);
                        var month = currentTime.getMonth() + 1;
                        var day = currentTime.getDate();
                        var year = currentTime.getFullYear();
                        var hour = currentTime.getHours();
                        var minute = currentTime.getMinutes();
      
                      var date = day + "/" + month + "/" + year + " " + hour + ":" + minute;                      
                      
        
                        // Add to menu items array
                        items.push({
                            title: title,
                            subtitle: date
                        });
           
                    }
                    // Finally return whole array
                    return items;
                };

                // Count number of active calls
                var aCount = data.lstAlertedAccounts.length;
                console.log('number of STEM Pro Alerts: ' + aCount);

                var menuItems = [];

                if (aCount === 0) {
                    menuItems.push({
                        title: "No Alerts",
                      subtitle: "is STEM Pro enabled?"
                    });
                } else {
                    // Create an array of Menu items
                    menuItems = parseFeed(data, aCount);
                }

                // Check the items are extracted OK
                for (var i = 0; i < menuItems.length; i++) {
                    console.log(menuItems[i].title + ' | ' + menuItems[i].subtitle);
                }


                // Construct Menu to show to user
                var resultsMenu = new UI.Menu({
                    sections: [{
                        title: 'STEM Pro',
                        items: menuItems
                    }]
                });

                // Show the Menu, hide the splash
                resultsMenu.show();
                splashWindowSTEMPRO.hide();

                // Register for 'tap' events
                resultsMenu.on('accelTap', function(e) {

                    // Make another request to openweathermap.org
                    ajax({
                            url: URLstempro,
                            type: 'json'
                        },
                        function(data) {

                            aCount = data.lstActiveCalls.length;
                            console.log('number of STEM Pro Alerts: ' + aCount);

                            var newItems = [];

                            if (aCount === 0) {
                                newItems.push({
                                    title: "No Active Calls",
                                    subtitle: "shake to refresh"
                                });
                            } else {

                                // Create an array of Menu items
                                newItems = parseFeed(data, aCount);
                            }

                            // Update the Menu's first section
                            resultsMenu.items(0, newItems);


                            // Notify the user
                            Vibe.vibrate('short');
                        },
                        function(error) {
                            console.log('Download failed: ' + error);
                        }
                    );
                });

                if (aCount > 0) {
                    // Add an action for SELECT
                    resultsMenu.on('select', function(e) {

                        //Get DATA
                        var cli = data.lstActiveCalls[e.itemIndex].CLI;
                        var accountid = data.lstActiveCalls[e.itemIndex].AccountID;
                        var connecttime = data.lstActiveCalls[e.itemIndex].Connect_time;
                        var content = 'CLD: ' + e.item.title + "\nCLI: " + cli + '\nAccount ID:' + accountid + '\nConnect Time:' + connecttime;

                        // Create the Card for detailed view
                        var detailCard = new UI.Card({
                            title: 'Details',
                            subtitle: e.item.subtitle,
                            body: content
                        });
                        detailCard.show();
                    });
                }
            },

            function(error) {
                // Failure!
                console.log('Failed fetching STEM Pro Report ' + error);
            }
        );
    }  
  
  
});


// Prepare the accelerometer
Accel.init();
