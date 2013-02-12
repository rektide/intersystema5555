var dbus = require("dbus-promised"),
  underscore= require("underscore"),
  Q= require("q")

var FACE_SERVER= "org.freedesktop.Avahi.EntryGroup",
  FACE_ENTRYGROUP= "org.freedesktop.Avahi.EntryGroup",
  DNS_A= 0x1,
  DNS_PTR= 0xC,
  DNS_TXT= 0x10,
  DNS_SRV= 0x21

module.exports= {
	avahi: avahi,
	bus: makeBus,
	options: {
		name: "example service",
		interface: -1,
		protocol: -1,
		flags: 256,
		type: "_webintents._tcp",
		domain: "", // avahi defaults to .local
		host: "", // avahi defaults to localhost
		port: Math.floor(Math.random()*2998)+7001,
		txt: "location=/webintents.html action=http://webintents.org/view"
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

	// generate service objects
	opts.serviceServer= opts.bus.getService(FACE_SERVER)
	opts.serviceEntryGroup= opts.bus.getService(FACE_ENTRYGROUP)

	// make an entrygroup
	var avahiServer= getAvahiServer(opts),
	  entryGroupPath= avahiServer.then(function(server){return server.EntryGroupNew()}),
	  entryGroup= entryGroupPath.then(function(path){return getEntryGroup(path,opts)})

	// build service & records
	var srv= entryGroup.then(addService.bind(opts)),
	  ptr= entryGroup.then(addRecord(opts,

	// generate take-down codepath
	var cleanup= function(){
		this.then(function(eg){
			eg.Free()
		})
	}.bind(entryGroup)
	return {entryGroup:entryGroup, path:entryGroupPath, srv:srv, cleanup:cleanup}
}

function getAvahiServer(opts){
	return opts.serviceServer.getInterface("/org/freedesktop/Avahi/Server",FACE_SERVER) }

function getEntryGroup(path,opts){
	return opts.serviceEntryGroup.getInterface(path,FACE_ENTRYGROUP) }

function addService(eg){
	return eg.AddService(this.interface,this.proto,this.flags,this.name,this.type,this.domain,this.host,this.port,this.txt) }

function addRecord(opts,val,type,ttl,rdata){
	function _addRecord(eg){
		return eg.AddRecord(this.interface,this.proto,this.flags,val,0x1,type,ttl,rdata)
	}
	return _addRecord.bind(opts)
}
