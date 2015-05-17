$(function()
{


$( "#accordion" ).accordion({collapsible: true, active: false});

$("form").submit(function()
    {
        $(this).children('select').each(function(){
        	console.log($(this).val());
        	 if($(this).val() == "Click to apply filter") {
        	 	$(this).attr("disabled", "disabled");
        	 }
        });
        return true; // ensure form still submits
    });

});