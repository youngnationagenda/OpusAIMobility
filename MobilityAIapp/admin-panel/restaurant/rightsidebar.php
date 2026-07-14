<?php 
    if(isset($_GET['p']))
    {
        if($_GET['p'] == 'users')
        {
            $user ="active-side-bar";
        }
        if($_GET['p'] == 'rider')
        {
            $rider ="active-side-bar";
        }

        if($_GET['p'] == 'restaurants')
        {
            $restaurants ="active-side-bar";
            
        }
        if($_GET['p'] == 'foodCategory')
        {
            $foodCategory ="active-side-bar";
            
        }
        
        if($_GET['p'] == 'sliderImage')
        {
            $manageSlider ="active-side-bar";
            
        }
        
        
        if($_GET['p'] == 'foodOrders')
        {
            $foodOrders ="active-side-bar";
            
        }
        if($_GET['p'] == 'setting')
        {
            $setting ="active-side-bar";
        }

        if($_GET['p'] == 'packageSize')
        {
            $packageSize ="active-side-bar";
        }
        if($_GET['p'] == 'goodType')
        {
            $goodType ="active-side-bar";
        }
        if($_GET['p'] == 'showParcelOrders')
        {
            $showParcelOrders ="active-side-bar";
            
        }

        if($_GET['p'] == 'manageTrip')
        {
            $manageTrip ="active-side-bar";
            $drop3 ="d-block";
        }
        
        if($_GET['p'] == 'tripRequest')
        {
            $tripRequest ="active-side-bar";
            $drop3 ="d-block";
        }
        
        
    }
?>

<div class="sidebar-container">
    <div class="sidebar-navigation-container">
        <div class="sidebar-navigation">
            <ul class="navigation-content-container">
                
                <li class="navigation-list-item">
                    <a href="dashboard.php?p=restaurants" class="list-item-content <?php echo $restaurants;?>">
                        <i class="fa fa-user sidebarIcon" aria-hidden="true"></i>
                        Manage Restaurants
                    </a>
                </li>
                <li class="navigation-list-item">
                    <a href="dashboard.php?p=foodOrders" class="list-item-content <?php echo $foodOrders;?>">
                        <i class="fa fa-user sidebarIcon" aria-hidden="true"></i>
                        Manage Orders
                    </a>
                </li>
                
            </ul>
            
        </div>
        <div class="footerSidebar">
            <ul class="navigation-content-container">
                <li class="navigation-list-item">
                    <a href="dashboard.php?p=setting" class="list-item-content <?php echo $setting;?>">
                        <i class="fa fa-cog sidebarIcon" aria-hidden="true"></i>
                        <span class="list-item-text">Settings</span>
                    </a>
                </li>
            </ul>
        </div>
    </div>
</div>

<!-- Filter side bar  -->
<div class="filter-bar-container">
    <div class="filter-bar-container-header">
        <h3>More filters</h3>
        <div class="filter-close-icon">
            <i class="fal fa-times"></i>
        </div>
    </div>
    <div class="filter-bar-container-body">
        <button class="accordion">
            Delivery method
            <i class="far fa-chevron-down"></i>
        </button>
        <div class="panel">
            <div class="filter-content-container">
                <ul>
                    <li>
                        <input type="checkbox">
                        <label>Local delivery</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Local pickup</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Ship to customer</label>
                    </li>
                </ul>
                <button class="clear">Clear</button>
            </div>
        </div>
        <button class="accordion">
            Status
            <i class="far fa-chevron-down"></i>
        </button>
        <div class="panel">
            <div class="filter-content-container">
                <ul>
                    <li>
                        <input type="radio" id="open" name="oac">
                        <label for="open">Open</label>
                    </li>
                    <li>
                        <input type="radio" id="archive" name="oac">
                        <label for="archive">Archive</label>
                    </li>
                    <li>
                        <input type="radio" id="cancel" name="oac">
                        <label for="cancel">Canceled</label>
                    </li>
                </ul>
                <button class="clear">Clear</button>
            </div>
        </div>
        <button class="accordion">
            Payment status
            <i class="far fa-chevron-down"></i>
        </button>
        <div class="panel">
            <div class="filter-content-container">
                <ul>
                    <li>
                        <input type="checkbox">
                        <label>Authorized</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Expired</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Overdue</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Paid</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Partially paid</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Partially refunded</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Pending</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Refunded</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Unpaid</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Voided</label>
                    </li>
                </ul>
                <button class="clear">Clear</button>
            </div>
        </div>
        <button class="accordion">
            Fulfillment status
            <i class="far fa-chevron-down"></i>
        </button>
        <div class="panel">
            <div class="filter-content-container">
                <ul>
                    <li>
                        <input type="checkbox">
                        <label>Fulfilled</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Unfulfilled</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Partially fulfilled</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Scheduled</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>On hold</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Request declined</label>
                    </li>
                </ul>
                <button class="clear">Clear</button>
            </div>
        </div>
        <button class="accordion">
            Tagged with
            <i class="far fa-chevron-down"></i>
        </button>
        <div class="panel">
            <div class="filter-content-container">
                <input type="text" class="input-feild">
                <button class="clear">Clear</button>
            </div>
        </div>
        <button class="accordion">
            Chargeback and inquiry status
            <i class="far fa-chevron-down"></i>
        </button>
        <div class="panel">
            <div class="filter-content-container">
                <ul>
                    <li>
                        <input type="radio" id="open" name="oac2">
                        <label for="open">Open</label>
                    </li>
                    <li>
                        <input type="radio" id="submit" name="oac2">
                        <label for="submit">Submited</label>
                    </li>
                    <li>
                        <input type="radio" id="won" name="oac2">
                        <label for="won">Won</label>
                    </li>
                    <li>
                        <input type="radio" id="lost" name="oac2">
                        <label for="lost">Lost</label>
                    </li>
                    <li>
                        <input type="radio" id="any" name="oac2">
                        <label for="any">Any</label>
                    </li>
                </ul>
                <button class="clear">Clear</button>
            </div>
        </div>
        <button class="accordion">
            Risk level
            <i class="far fa-chevron-down"></i>
        </button>
        <div class="panel">
            <div class="filter-content-container">
                <ul>
                    <li>
                        <input type="checkbox">
                        <label>High</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Medium</label>
                    </li>
                    <li>
                        <input type="checkbox">
                        <label>Low</label>
                    </li>
                </ul>
                <button class="clear">Clear</button>
            </div>
        </div>
        <button class="accordion">
            Date
            <i class="far fa-chevron-down"></i>
        </button>
        <div class="panel">
            <div class="filter-content-container">
                <ul>
                    <li>
                        <input type="radio" id="today" name="oac3">
                        <label for="today">Today</label>
                    </li>
                    <li>
                        <input type="radio" id="7days" name="oac3">
                        <label for="7days">Last 7 days</label>
                    </li>
                    <li>
                        <input type="radio" id="30days" name="oac3">
                        <label for="30days">Last 30 days</label>
                    </li>
                    <li>
                        <input type="radio" id="90days" name="oac3">
                        <label for="90days">Last 90 days</label>
                    </li>
                    <li>
                        <input type="radio" id="custom" name="oac3">
                        <label for="custom">Custom</label>
                    </li>
                </ul>
                <button class="clear">Clear</button>
            </div>
        </div>
        <button class="accordion">
            Credit card (Last four digits)
            <i class="far fa-chevron-down"></i>
        </button>
        <div class="panel">
            <div class="filter-content-container">
                <input type="text" placeholder="xxxx" class="input-feild">
                <button class="clear">Clear</button>
            </div>
        </div>
    </div>
    <div class="filter-bar-container-footer">
        <button class="clear-filter">Clear all filters</button>
        <button class="add-product-btn">Done</button>
    </div>
</div>

<script>
    var acc = document.getElementsByClassName("accordion");
    var i;
    
    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
        this.classList.toggle("active-tab");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
            panel.style.display = "none";
        } else {
            panel.style.display = "block";
        }
        });
    }
    $(document).ready(function(){
        $( ".lead-more-filter" ).on( "click", function() {
            $( ".filter-bar-container" ).toggleClass( "show");
        });
        $('.filter-close-icon').on('click',function(){
            $('.filter-bar-container').removeClass('show');
        });
    });
</script>