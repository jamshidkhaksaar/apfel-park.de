<?php
	// Getting data of the  Facts in Digits box
	global $tm_global_fid_element_values;
	
	if( is_array($tm_global_fid_element_values) ) :
	
?>
<div class="tm-fid-main-border">
	<?php get_template_part('template-parts/fidbox/fidbox', 'righticon'); ?>
</div>
<?php

	endif;
	
	// Resetting data of the Facts in Digits box
	$tm_global_fid_element_values = '';
?>