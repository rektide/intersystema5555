var dbus = require("dbus-promised"),
  underscore= require("underscore"),
  Q= require("q")

module.exports= {
	avahi: avahi,
	bus: makeBus,
	options: {
		interface: -1,
		protocol: -1,
		flags: 0,
		name: "example service",
		type: "service-type",
		domain: "domain",
		host: "host",
		port: "port",
		txt: "text"
	}
}

function makeBus(){
	var bus= dbus.sessionBus()
	module.exports.bus= function(){return this}.bind(bus)
	return bus
}

function avahi(opts,bus){
	bus= bus||module.exports.bus()
	opts= underscore.extend(opts||{},module.export.options)
	opts.bus= bus
	opts.defer= Q.defer()
	var fail= opts.defer.reject.bind(opts.defer)
	bus.getService("org.freedesktop.Avahi.Server").getInterface("/org/freedesktop/Avahi/Server","org.freedesktop.Avahi.Server",function(err, server){
		if(err) return fail(err)
		server.EntryGroupNew()
		.then(function(path){
			console.debug("Added EntryGroup")
			this.bus.getService("org.freedesktop.Avahi.EntryGroup").getInterface(path,"org.freedesktop.Avahi.EntryGroup",function(err, eg){
				if(err) this.defer.reject(err)
				var service= eg.AddService(this.interface,this.proto,this.flags,this.name,this.type,this.domain,this.host,this.port,this.txt)
				.then(function(err){
					if(err) return fail(err)
					this.resolve()
				}.bind(this),fail)
			})
		},fail)
	})
}
