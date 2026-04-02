import { useEffect } from 'react';
import * as THREE from 'three';

export function ThreeTest() {
  useEffect(() => {
    console.log('🧪 THREE Test Component');
    console.log('THREE exists:', !!THREE);
    console.log('THREE.Group exists:', !!THREE.Group);
    console.log('THREE.Raycaster exists:', !!THREE.Raycaster);
    console.log('Can create Group?:', !!new THREE.Group());
    console.log('Can create Raycaster?:', !!new THREE.Raycaster());
    
    // Test actual creation
    try {
      const group = new THREE.Group();
      const raycaster = new THREE.Raycaster();
      console.log('✅ Successfully created THREE objects!');
      console.log('Group type:', group.type);
      console.log('Raycaster type:', raycaster.constructor.name);
    } catch (error) {
      console.error('❌ Failed to create THREE objects:', error);
    }
  }, []);

  return null;
}