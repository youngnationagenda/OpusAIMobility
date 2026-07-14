
function ClosePopup() 
{
    document.getElementById("PopupParent").style.display = "none";
}

function confirmAction()
{
    var x = confirm("Are you sure you want to perform this action?");
    if(x)
    {
        return true;
    }
    else
    {
        return false;
    }
}
function addClient()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addClient");
    xmlhttp.send();
}
function addUser()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addUser");
    xmlhttp.send();
}
function editUser(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editUser&id="+id);
    xmlhttp.send();
}

function editRider(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editRider&id="+id);
    xmlhttp.send();
}

function addFoodCategory()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addFoodCategory");
    xmlhttp.send();
}
function editFoodCategory(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editFoodCategory&id="+id);
    xmlhttp.send();
}

function addPackageSize()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addPackageSize");
    xmlhttp.send();
}
function editPackageSize(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editPackageSize&id="+id);
    xmlhttp.send();
}

function addRideType()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addRideType");
    xmlhttp.send();
}
function editRideType(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editRideType&id="+id);
    xmlhttp.send();
}
function addGoodType()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addGoodType");
    xmlhttp.send();
}
function editGoodType(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editGoodType&id="+id);
    xmlhttp.send();
}
function addSliderImage()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addSliderImage");
    xmlhttp.send();
}

function addRestaurant()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addRestaurant");
    xmlhttp.send();
}
function addRestaurantTiming(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addRestaurantTiming&id="+id);
    xmlhttp.send();
}
function addCoupon()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addCoupon");
    xmlhttp.send();
}
function editCoupon(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editCoupon&id="+id);
    xmlhttp.send();
}
function editRestaurant(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editRestaurant&id="+id);
    xmlhttp.send();
}
function restaurantOwnerResponse(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=restaurantOwnerResponse&id="+id);
    xmlhttp.send();
}
function addLead()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addLead");
    xmlhttp.send();
}
function addProject()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addProject");
    xmlhttp.send();
}
function addSource()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addSource");
    xmlhttp.send();
}
function addForce()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addForce");
    xmlhttp.send();
}
function changePassword()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=changePassword");
    xmlhttp.send();
}
function addTask()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addTask");
    xmlhttp.send();
}
function addAdminUser()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addAdminUser");
    xmlhttp.send();
}
function editAdminUser(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editAdminUser&id="+id);
    xmlhttp.send();
}
function changeAdminPassword(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=changeAdminPassword&id="+id);
    xmlhttp.send();
}
function addMenu(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addMenu&id="+id);
    xmlhttp.send();
}
function editMenu(id,restaurant_id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editMenu&id="+id+"&restaurant_id="+restaurant_id);
    xmlhttp.send();
}
function addImport()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addImport");
    xmlhttp.send();
}
function addexport()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addexport");
    xmlhttp.send();
}
function showTask(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=showTask&id="+id);
    xmlhttp.send();
}
function selectName(event) {
    var sourcerName = event;
    jQuery(function($) {
        $('#sourceDrop').css("display", "block");
    });
}
function addLeadTask(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addLeadTask&id="+id);
    xmlhttp.send();
}
function callRecording(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "Loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();

    } 
    else 
    {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=callRecording&id="+id);
    xmlhttp.send();
}
function showLeadTask(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";

    var xmlhttp;
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else {// code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=showLeadTask&id="+id);
    xmlhttp.send();
}
function addReportReason()
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) 
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addReportReason");
    xmlhttp.send();
}
function editReportReason(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editReportReason&id="+id);
    xmlhttp.send();
}
function selectValue(event) {
    var select = event;
    jQuery(function($) {
        var name = $(select).data('name');
        var id = $(select).val();
        $('#userName').val(name);
        $('#user_id').val(id);
        $('#sourceDrop').css("display", "none");
 
    });
}  
$(document).on('click', function(){
    $('#sourceDrop').hide();
});
function validatePassword() 
{
    var password = document.getElementById("new-password"), 
    confirm_password = document.getElementById("confirme-password");
    if (password.value != confirm_password.value) 
    {
        confirm_password.setCustomValidity("Passwords Don't Match");
    } 
    else 
    {
        confirm_password.setCustomValidity('');
    }
}

function getTaskSubType(event){
    var select = event;
    var id = $(select).val();
    jQuery(function($) {
        $('#task_sub_type_id').html("<option value=''>Loading...</option>");
        $.ajax({
            url: 'process.php?action=getTaskSubType',
            type: 'POST',
            data: { id: id },
            success: function (data) 
            {
                $('#task_sub_type_id').html(data);
                $('#subtask').show();
            }
        });
    });
}

function mainSearch(event) {
    var user = event;
    jQuery(function($) {
        var txt = $(user).val();
        if(txt != '')
        {
            $.ajax({
                url: 'process.php?action=mainSearch',
                type: 'POST',
                data:{search:txt},
                success: function (data) {
                    $('.mainSearch').css("display", "block");
                    $('.mainSearch').html(data);
                }
            }); 
        }
        else
        {
            $('.mainSearch').html();
            
        }
    });
}
function selectKeyword(event) 
{
    jQuery(function($) 
    {
        var name = $('.searchtitle').html();
        $('#search').val(name);
        $('.mainSearch').css("display", "none");
    });
}
$(document).on('click', function(){
    $('.mainSearch').hide();
});


function openMenu(menuid){ 
    jQuery(function($) {
        $('.submenu-wrapper'+menuid).slideToggle( "slow" );
    });
}

function openMenuExtraSection(id){ 
    jQuery(function($) {
        $('.soft-drink-section'+id).slideToggle( "slow" );
    });
}
$(document).ready(function(){

    // add new menu item  function 
    $(".addnewmenu_item").on("click", function(){
        var addnewmenu_item = $(this).data("menu-id");
        var restaurant_id = $(this).data("restaurant-id");
        var addnewmenuitem_Html = `
            <h3 class="addmenuheading">
                <i class="fa fa-plus-circle" style="margin-right: 5px;"></i> 
                Add New Menu Item
            </h3>
            <form action="process.php?action=addMenuItem&id=`+restaurant_id+`" method="post" enctype="multipart/form-data" class="form addmenuform" id="adnewmenuitmfrm">
                <input type='hidden' name='restaurant_menu_id' id='menuid' value='`+addnewmenu_item+`'>
                <div class="input-email-container">
                    <input type="text" name="name" id="menu_name" placeholder="Name">
                </div>
                <div class="input-email-container">
                    <input type="text" name="description" id="menu_dsc" placeholder="Description">
                </div>
                <div class="input-email-container">
                    <input type="text" name="price" id="menu_price" placeholder="Price">
                </div>
                <div class="input-email-container">
                    <input name="image" id="menu_image" style="padding: 8px;" type="file">
                </div>
                <div class="clear"></div>
                <div class="input-submit-container">
                    <input type='submit' class="add-product-btn px-3" value='Add Menu Item'>
                </div>
            </form>
        `;
        $(this).hide();
        $(this).parent().append(addnewmenuitem_Html);
    });

    // Add Menu Extra Section function
    $(".addnewmenu_extrasection").on("click", function(){
        var restaurant_menu_item_id = $(this).attr("data-restaurant-menu-item-id");
        var restaurant_id = $(this).data("restaurant-id");
        var addnewmenu_extraitem_Html = `
            <h3 class='addnewmenu_extrasection'>
                <i class='fa fa-plus-circle' style='margin-right: 5px;'></i> 
                Add Menu Extra Section
            </h3>
            <form action='process.php?action=addMenuExtraSection&id=`+restaurant_id+`' method='post' class='form addmenuform' id='adextrsctfrm'> 
                <input type='hidden' name='restaurant_menu_item_id' id='restomenuitem' value="`+restaurant_menu_item_id+`">
                <div class="input-email-container">
                    <input type='text' name='name' id='sec_name' placeholder='Section Name'>
                </div>
                <div class="input-email-container">
                    <p style='text-align:left;'> 
                        <input type='checkbox' style="width: 13px;" name='required' id='require_items' value='1' /> Required?
                        <span style='display:block;font-size:11px;margin-top:5px;color:#aaa;'>If checked, this section will require to
                            fill.
                        </span>
                    </p>
                </div>
                <div class="clear"></div>
                <div class="input-submit-container">
                    <input type='submit' class="add-product-btn px-3" value='Add Extra Section'>
                </div>
            </form>
        `;
        $(this).hide();
        $(this).parent().append(addnewmenu_extraitem_Html);
    });

    // add section extra item function 
    $(".addnewmenu_extraitem").on("click", function(){
        var menuextrasectionid = $(this).attr("data-menu-extra-section-id");
        var restaurant_id = $(this).data("restaurant-id");
        var menuHtml = `
            <h3 class='addnewmenu_extraitem'>
                <i class='fa fa-plus-circle' style='margin-right: 5px;'></i> Add Section Extra Item
            </h3>
            <form action='process.php?action=addMenuExtraItem&id=`+restaurant_id+`' method='post' class='form addmenuform' id='adextrsctitmfrm'>
                <input type='hidden' name='restaurant_menu_extra_section_id' id='menu_extra_sectionid' value=" `+menuextrasectionid+`"> 
                <div class="input-email-container">
                    <input type='text' name='name' id='menu_name' placeholder='Name'>
                </div>
                <div class="input-email-container">
                    <input type='text' name='price' id='menu_price' placeholder='Price'>
                </div>
                <div class="input-submit-container">
                    <input type='submit' class="add-product-btn px-3" value='Add Section Extra Item'>
                </div>
            </form>
        `;
        $(this).hide();
        $(this).parent().append(menuHtml);
    });

    //edit main menu item
	jQuery(".main_menu_item_edit").on("click", function(){
        var restaurant_id = $(this).data("restaurant-id");
		var mainmenuid = jQuery(this).attr("data-main-menu-id");
		var menuid = jQuery(this).attr("data-menu-id");
		var menuname = jQuery(this).attr("data-menu-name");
		var menudesc = jQuery(this).attr("data-menu-description");
		var menuprce = jQuery(this).attr("data-menu-price");
		var menuoutofstock = jQuery(this).attr("data-out-of-stock");
		if(menuoutofstock=="1")
		{
			var menuoutofstock = "checked";
		}
        var addnewmenuitem_Html = `
            <div class="add_new_menu">
                <div class="addmenu" style="margin-top: 0;">
                    <h3 class="addmenuheading">
                        Edit Menu Item
                    </h3>
                    <form action="process.php?action=editMenuItem&id=`+restaurant_id+`" method="post" enctype="multipart/form-data" class="form addmenuform" id="adnewmenuitmfrm">
                        <input type='hidden' name='restaurant_menu_id' id='menuid' value='`+mainmenuid+`'>
                        <input type='hidden' name='id' id='menuid' value='`+menuid+`'>
                        <div class="input-email-container">
                            <input type="text" name="name" id="menu_name" placeholder="Name"  value='`+menuname+`'>
                        </div>
                        <div class="input-email-container">
                            <input type="text" name="description" id="menu_dsc" placeholder="Description" value='`+menudesc+`'>
                        </div>
                        <div class="input-email-container">
                            <input type="text" name="price" id="menu_price" placeholder="Price" value='`+menuprce+`'>
                        </div>
                        <div class="input-email-container">
                            <input name="image" id="menu_image" style="padding: 8px;" type="file" value=''>
                        </div>
                        <div class="input-email-container">
                            <p style="text-align:left;"> 
                                <input type="checkbox" style="width: 13px;" name="outofstock" id="require_items" value="1" `+menuoutofstock+`> Out Of Stock
                            </p>
                        </div>
                        <div class="clear"></div>
                        <div class="input-submit-container">
                            <input type='submit' class="add-product-btn px-3" value='Update Menu Item'>
                        </div>
                    </form>
                </div>
            </div>
        `;
		jQuery("#main_menu_item_edit_div_"+menuid).html(addnewmenuitem_Html);
	});
    //edit main menu item section
	jQuery(".main_menu_item_section_edit").on("click", function(){
		var restaurant_id = jQuery(this).attr("data-restaurant-id");
		var restaurant_menu_item_id = $(this).data('menu-item-id');
        var section_id = $(this).data('section-id');
        var section_name= $(this).data('section-name');
        var section_required = $(this).data('section-required');

		if( section_required == "1" ) {
			var sectr = "checked";
		} else {
			var sectr = "";
		}
        var addnewmenu_extraitem_Html = `
            <div class="edit-menu-extra-section">
                <h3 class='addnewmenu_extrasection'>
                    Edit Menu Extra Section
                </h3>
                <form action='process.php?action=editMenuExtraSection&id=`+restaurant_id+`' method='post' class='form addmenuform' id='adextrsctfrm'> 
                    <input type='hidden' name='restaurant_menu_item_id' id='restomenuitem' value="`+restaurant_menu_item_id+`">
                    <input type='hidden' name='id' id='restomenuitem' value="`+section_id+`">
                    <div class="input-email-container">
                        <input type='text' name='name' id='sec_name' placeholder='Section Name' value="`+section_name+`">
                    </div>
                    <div class="input-email-container">
                        <p style='text-align:left;'> 
                            <input type='checkbox' style="width: 13px;" name='required' id='require_items' value='1' `+sectr+` /> Required?
                            <span style='display:block;font-size:11px;margin-top:5px;color:#aaa;'>If checked, this section will require to
                                fill.
                            </span>
                        </p>
                    </div>
                    <div class="clear"></div>
                    <div class="input-submit-container">
                        <input type='submit' class="add-product-btn px-3" value='Update Extra Section'>
                    </div>
                </form>
            </div>
        `;
	
		jQuery("#main_menu_item_section_edit_div_"+section_id).html(addnewmenu_extraitem_Html);
	});
    // Edit section extra item function 
    $(".section-extra-item").on("click", function(){
        var section_id = $(this).attr("data-section-id");
        var restaurant_id = $(this).data("restaurant-id");
        var extra_item_id = $(this).data("extra-item-id");
        var extra_section_name = $(this).data("extra-section-name");
        var extra_section_price = $(this).data("extra-section-price");
        var menuHtml = `
            <div class="addmenu">
                <h3 class='addnewmenu_extraitem'>
                    <i class='fa fa-plus-circle' style='margin-right: 5px;'></i> Add Section Extra Item
                </h3>
                <form action='process.php?action=editMenuExtraItem&id=`+restaurant_id+`' method='post' class='form addmenuform' id='adextrsctitmfrm'>
                    <input type='hidden' name='restaurant_menu_extra_section_id' id='menu_extra_sectionid' value=" `+section_id+`"> 
                    <input type='hidden' name='id' id='menu_extra_sectionid' value=" `+extra_item_id+`"> 
                    <div class="input-email-container">
                        <input type='text' name='name' id='menu_name' placeholder='Name' value="`+extra_section_name+`">
                    </div>
                    <div class="input-email-container">
                        <input type='text' name='price' id='menu_price' placeholder='Price' value="`+extra_section_price+`">
                    </div>
                    <div class="input-submit-container">
                        <input type='submit' class="add-product-btn px-3" value='Update Section Extra Item'>
                    </div>
                </form>
            </div>
        `;
        jQuery("#section-extra-item-"+extra_item_id).html(menuHtml);
    });

});

function addRestaurantCategory(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addRestaurantCategory&id="+id);
    xmlhttp.send();
}

function editServiceFee(id)
{
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=editServiceFee&id="+id);
    xmlhttp.send();
}






// new functions
$(".assignRider").on("click", function(){
    
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var order_id=$(this).attr("data-id"); 
    
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=showRiders&order_id="+order_id);
    xmlhttp.send();
    
});


$(".parcel_assignRider").on("click", function(){
    
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var order_id=$(this).attr("data-id"); 
    
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=parcel_assignRider&order_id="+order_id);
    xmlhttp.send();
    
});

$(".changeFoodOrderStatus").on("click", function(){
    
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var order_id=$(this).attr("data-id"); 
    
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=changeFoodOrderStatus&order_id="+order_id);
    xmlhttp.send();
    
});

$(".addRider").on("click", function(){
    
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=addRider");
    xmlhttp.send();
    
});

$(".parcel_changeStatus").on("click", function(){
    
    document.getElementById("PopupParent").style.display = "block";
    document.getElementById("contentReceived").innerHTML = "loading...";
    var order_id=$(this).attr("data-id"); 
    
    var xmlhttp;
    if (window.XMLHttpRequest) 
    {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } 
    else 
    {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
        {
            // alert(xmlhttp.responseText);
            document.getElementById('contentReceived').innerHTML = xmlhttp.responseText;
        }
    }
    xmlhttp.open("GET", "ajex-events.php?q=parcel_changeStatus&order_id="+order_id);
    xmlhttp.send();
    
});





