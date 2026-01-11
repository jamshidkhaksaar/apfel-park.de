<?php if( themetechmount_topbar_show() ) : ?>

<div class="themetechmount-topbar-wrapper <?php echo themetechmount_sanitize_html_classes(themetechmount_topbar_classes()); ?>">
	<div class="themetechmount-topbar-inner">
		<div class="<?php echo themetechmount_sanitize_html_classes(themetechmount_topbar_container_class()); ?>">
			<?php echo themetechmount_wp_kses( themetechmount_topbar_content(), 'topbar' ); ?>
		</div>
	</div>
</div>

<?php endif;  // themetechmount_topbar_show() ?>
