<?php
    if (isset($_SESSION[PRE_FIX . 'id']))  
    {
        $url = $baseurl . 'showUserRestaurant'; 
        $data = array(
            "user_id" => $_SESSION[PRE_FIX . 'id']   
        );
        $json_data = @curl_request($data, $url);
        $json_data=$json_data['msg'];
        ?>
            <div class="main-content-container">
                <div class="main-content-container-wrap">
                    <div class="content-page-header">
                        <div class="page-header-text">Restaurants</div>
                    </div>
                    <div class="content-page-container">
                        <div class="content-tabel-container">
                            <div class="content-tabel-nav">
                                <ul class="nav nav-tabs" id="myTab" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <a class="nav-link active" id="home-tab" data-toggle="tab" href="#All" role="tab" aria-controls="home" aria-selected="true">All</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="tab-content" id="myTabContent">
                                <div class="tab-pane fade show active" id="All" role="tabpanel" aria-labelledby="home-tab">
                                    <div class="order-tabel-container">
                                        <table class="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th scope="col">
                                                        <input type="checkbox">
                                                    </th>
                                                    <th scope="col">ID</th>
                                                    <th scope="col">Owner Name</th>
                                                    <th scope="col">Name</th>
                                                    <th scope="col">Min Order Price</th>
                                                    <th scope="col">Created</th>
                                                    <th scope="col">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            
                                                <tr>
                                                    <th scope="row">
                                                        <div class="tabel-img-container">
                                                            <input type="checkbox">
                                                        </div>
                                                    </th>
                                                    <td>
                                                        <div class="td-container">
                                                            <?php echo $json_data['Restaurant']['id']; ?>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div class="td-container">
                                                            <?php echo $json_data['User']['first_name']." ".$json_data['User']['last_name'] ; ?>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div class="td-container">
                                                            <?php 
                                                                $name = strtolower($json_data['Restaurant']['name']); 
                                                                echo ucwords($name);
                                                            ?>
                                                        </div>
                                                    </td>
                                                    
                                                    <td>
                                                        <div class="td-container">
                                                            <?php 
                                                                echo $json_data['Restaurant']['min_order_price'];
                                                            ?>
                                                        </div>
                                                    </td>
                                                    <td title="<?php echo date("d M Y h:i A",strtotime($json_data['Restaurant']['created']));?>">
                                                        <div class="td-container">
                                                            <?php
                                                                $timestamp = strtotime($json_data['Restaurant']['created']);
                                                                echo date("d M Y", $timestamp);
                                                            ?>
                                                        </div>
                                                        
                                                    </td>
                                                    <td>
                                                        <div class="td-container">
                                                            <div class="dropdown">
                                                                <i title="Edit Restaurant" class="fas fa-edit" style="color:#90908f;cursor: pointer;" onclick="editRestaurant(<?php echo $json_data['Restaurant']['id']; ?>)"></i>&nbsp;
                                                                <i title="Add Restaurant Timing" class="fas fa-clock" style="color:#90908f;cursor: pointer;" onclick="addRestaurantTiming(<?php echo $json_data['Restaurant']['id']; ?>)"></i>&nbsp;
                                                                <a href="dashboard.php?p=restaurantManageMenu&id=<?php echo $json_data['Restaurant']['id']?>"><i title="Manage Menu" class="fas fa-utensils fa-fw" style="color:#90908f;cursor: pointer;"></i></a>&nbsp;
                                                                <i title="Setup Category" class="fas fa-edit" style="color:#90908f;cursor: pointer;" onclick="addRestaurantCategory(<?php echo $json_data['Restaurant']['id']; ?>)"></i>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>

        <?php
    } 
    else 
    {
        echo "<script>window.location='index.php'</script>";
        die;
    }
?>