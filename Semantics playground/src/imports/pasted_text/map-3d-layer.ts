map.on('load', () => {
      // Create custom THREE.js layer
      const customLayer: mapboxgl.CustomLayerInterface = {
        id: '3d-model',
        type: 'custom',
        renderingMode: '3d',
        
        onAdd: function(map: mapboxgl.Map, gl: WebGLRenderingContext) {
          const layer = this as any;
          
          // Create THREE.js scene
          layer.camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1e6);
          layer.scene = new THREE.Scene();

          // Create ambient light
          const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
          layer.scene.add(ambientLight);

          // Create directional light
          const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
          directionalLight.position.set(0, 70, 100);
          layer.scene.add(directionalLight);

          // Add another directional light from a different angle
          const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
          directionalLight2.position.set(100, 50, -50);
          layer.scene.add(directionalLight2);

          // Array to store all chairs for hover detection
          layer.chairs = [];
          layer.originalChairColor = 0x2a2a2a;
          layer.hoverChairColor = 0x4da6ff;

          // Helper function to create a wall
          const createWall = (width: number, height: number, depth: number, x: number, y: number, z: number) => {
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
            const wall = new THREE.Mesh(geometry, material);
            wall.position.set(x, y, z);
            layer.scene.add(wall);
            return wall;
          };

          // Helper function to create floor
          const createFloor = (width: number, depth: number, x: number, y: number, z: number) => {
            const geometry = new THREE.BoxGeometry(width, 2, depth);
            const material = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
            const floor = new THREE.Mesh(geometry, material);
            floor.position.set(x, y, z);
            layer.scene.add(floor);
            return floor;
          };

          // Helper function to create a table
          const createTable = (x: number, z: number) => {
            // Table top
            const topGeometry = new THREE.BoxGeometry(60, 3, 40);
            const topMaterial = new THREE.MeshLambertMaterial({ color: 0xd4d4d4 });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.set(x, 15, z);
            layer.scene.add(top);

            // Table legs
            const legGeometry = new THREE.BoxGeometry(3, 15, 3);
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0xa8a8a8 });
            const positions = [
              [x - 25, 7.5, z - 15],
              [x + 25, 7.5, z - 15],
              [x - 25, 7.5, z + 15],
              [x + 25, 7.5, z + 15]
            ];
            positions.forEach(pos => {
              const leg = new THREE.Mesh(legGeometry, legMaterial);
              leg.position.set(pos[0], pos[1], pos[2]);
              layer.scene.add(leg);
            });
          };

          // Helper function to create a communal table with benches
          const createCommunalTable = (x: number, z: number, width: number, depth: number) => {
            // Table top
            const topGeometry = new THREE.BoxGeometry(width, 3, depth);
            const topMaterial = new THREE.MeshLambertMaterial({ color: 0xb0b0b0 });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.set(x, 15, z);
            layer.scene.add(top);

            // Table legs
            const legGeometry = new THREE.BoxGeometry(4, 15, 4);
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0x909090 });
            const halfWidth = width / 2 - 10;
            const halfDepth = depth / 2 - 10;
            const positions = [
              [x - halfWidth, 7.5, z - halfDepth],
              [x + halfWidth, 7.5, z - halfDepth],
              [x - halfWidth, 7.5, z + halfDepth],
              [x + halfWidth, 7.5, z + halfDepth]
            ];
            positions.forEach(pos => {
              const leg = new THREE.Mesh(legGeometry, legMaterial);
              leg.position.set(pos[0], pos[1], pos[2]);
              layer.scene.add(leg);
            });

            // Benches on long sides
            const benchGeometry = new THREE.BoxGeometry(width - 10, 8, 15);
            const benchMaterial = new THREE.MeshLambertMaterial({ color: 0xa8a8a8 });
            
            // Bench 1 (one side)
            const bench1 = new THREE.Mesh(benchGeometry, benchMaterial);
            bench1.position.set(x, 9, z - depth/2 - 15);
            layer.scene.add(bench1);
            
            // Bench 2 (other side)
            const bench2 = new THREE.Mesh(benchGeometry, benchMaterial);
            bench2.position.set(x, 9, z + depth/2 + 15);
            layer.scene.add(bench2);
          };

          // Helper function to create a vending machine
          const createVendingMachine = (x: number, z: number) => {
            // Main body
            const bodyGeometry = new THREE.BoxGeometry(25, 35, 20);
            const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xcc4444 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.set(x, 17.5, z);
            layer.scene.add(body);

            // Front panel (darker)
            const panelGeometry = new THREE.BoxGeometry(24, 25, 1);
            const panelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(x, 20, z + 10.5);
            layer.scene.add(panel);
          };

          // Helper function to create a desk
          const createDesk = (x: number, z: number, small: boolean = false) => {
            // Desk size varies based on small parameter
            const width = small ? 35 : 70;
            const depth = small ? 22 : 45;
            
            // Desk top
            const topGeometry = new THREE.BoxGeometry(width, 3, depth);
            const topMaterial = new THREE.MeshLambertMaterial({ color: 0xc9c9c9 });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.set(x, 15, z);
            layer.scene.add(top);

            // Desk legs
            const legGeometry = new THREE.BoxGeometry(3, 15, 3);
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
            const halfWidth = width / 2 - 5;
            const halfDepth = depth / 2 - 4;
            const positions = [
              [x - halfWidth, 7.5, z - halfDepth],
              [x + halfWidth, 7.5, z - halfDepth],
              [x - halfWidth, 7.5, z + halfDepth],
              [x + halfWidth, 7.5, z + halfDepth]
            ];
            positions.forEach(pos => {
              const leg = new THREE.Mesh(legGeometry, legMaterial);
              leg.position.set(pos[0], pos[1], pos[2]);
              layer.scene.add(leg);
            });
          };

          // Helper function to create a chair
          const createChair = (x: number, z: number) => {
            // Seat
            const seatGeometry = new THREE.BoxGeometry(15, 3, 15);
            const seatMaterial = new THREE.MeshLambertMaterial({ color: layer.originalChairColor });
            const seat = new THREE.Mesh(seatGeometry, seatMaterial);
            seat.position.set(x, 10, z);
            layer.scene.add(seat);

            // Backrest
            const backGeometry = new THREE.BoxGeometry(15, 15, 3);
            const backMaterial = new THREE.MeshLambertMaterial({ color: layer.originalChairColor });
            const back = new THREE.Mesh(backGeometry, backMaterial);
            back.position.set(x, 17, z - 6);
            layer.scene.add(back);

            // Legs
            const legGeometry = new THREE.BoxGeometry(2, 10, 2);
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            const positions = [
              [x - 5, 5, z - 5],
              [x + 5, 5, z - 5],
              [x - 5, 5, z + 5],
              [x + 5, 5, z + 5]
            ];
            positions.forEach(pos => {
              const leg = new THREE.Mesh(legGeometry, legMaterial);
              leg.position.set(pos[0], pos[1], pos[2]);
              layer.scene.add(leg);
            });

            // Store chair parts for hover detection
            const chairGroup = { seat, back, isHovered: false };
            layer.chairs.push(chairGroup);
          };

          // Helper function to create kitchen counter
          const createKitchenCounter = (x: number, z: number) => {
            // Counter top
            const counterGeometry = new THREE.BoxGeometry(80, 4, 30);
            const counterMaterial = new THREE.MeshLambertMaterial({ color: 0xb8b8b8 });
            const counter = new THREE.Mesh(counterGeometry, counterMaterial);
            counter.position.set(x, 18, z);
            layer.scene.add(counter);

            // Cabinet base
            const cabinetGeometry = new THREE.BoxGeometry(80, 18, 30);
            const cabinetMaterial = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });
            const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
            cabinet.position.set(x, 9, z);
            layer.scene.add(cabinet);
          };

          // Build the office layout
          
          // Main room floor - large rectangular room on the left
          createFloor(300, 450, -100, 0, 0);

          // Main room walls (purple outline)
          createWall(300, 50, 5, -100, 25, -225); // Top wall
          createWall(300, 50, 5, -100, 25, 225);  // Bottom wall
          createWall(5, 50, 450, -250, 25, 0);    // Left wall
          createWall(5, 50, 150, 50, 25, -150);   // Right wall (top section, before Office 1 doorway)
          createWall(5, 50, 150, 50, 25, 150);    // Right wall (bottom section, before Office 2 doorway)

          // Dividing wall between Office 1 and Office 2
          createWall(200, 50, 5, 150, 25, 0);     // Horizontal divider wall

          // Office 1 (top right) with doorway to main room
          createFloor(200, 220, 150, 0, -115);
          createWall(200, 50, 5, 150, 25, -225);  // Top wall
          createWall(5, 50, 220, 250, 25, -115);  // Right wall
          // Left wall is the right wall of main room with doorway gap

          // Office 2 (bottom right) with doorway to main room
          createFloor(200, 220, 150, 0, 115);
          createWall(200, 50, 5, 150, 25, 225);   // Bottom wall
          createWall(5, 50, 220, 250, 25, 115);   // Right wall
          // Left wall is the right wall of main room with doorway gap
          // Top wall is the divider between Office 1 and Office 2

          // Kitchenette counter with sink (grey square at top of main room)
          const kitchenSize = 70;
          const kitchenGeometry = new THREE.BoxGeometry(kitchenSize, 4, kitchenSize);
          const kitchenMaterial = new THREE.MeshLambertMaterial({ color: 0xb0b0b0 });
          const kitchen = new THREE.Mesh(kitchenGeometry, kitchenMaterial);
          kitchen.position.set(-180, 18, -170);
          layer.scene.add(kitchen);
          
          // Kitchen base
          const kitchenBaseGeometry = new THREE.BoxGeometry(kitchenSize, 18, kitchenSize);
          const kitchenBaseMaterial = new THREE.MeshLambertMaterial({ color: 0xc8c8c8 });
          const kitchenBase = new THREE.Mesh(kitchenBaseGeometry, kitchenBaseMaterial);
          kitchenBase.position.set(-180, 9, -170);
          layer.scene.add(kitchenBase);

          // Sink on counter
          const sinkGeometry = new THREE.BoxGeometry(20, 2, 15);
          const sinkMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
          const sink = new THREE.Mesh(sinkGeometry, sinkMaterial);
          sink.position.set(-180, 21, -170);
          layer.scene.add(sink);

          // Vending machines (red squares)
          createVendingMachine(-100, -185);
          createVendingMachine(-60, -185);

          // Communal tables with benches in main room
          createCommunalTable(-180, -50, 110, 65);
          createCommunalTable(-180, 70, 110, 65);
          createCommunalTable(-50, -50, 110, 65);

          // Office 1 - desk islands (clusters of 4 desks with chairs facing inward)
          // Island 1 - top area
          createDesk(100, -150, true);
          createChair(100, -170); // Chair next to desk, facing it
          
          createDesk(140, -150, true);
          createChair(140, -170); // Chair next to desk, facing it
          
          createDesk(100, -110, true);
          createChair(100, -90); // Chair next to desk, facing it
          
          createDesk(140, -110, true);
          createChair(140, -90); // Chair next to desk, facing it

          // Island 2 - bottom area
          createDesk(190, -150, true);
          createChair(190, -170); // Chair next to desk, facing it
          
          createDesk(230, -150, true);
          createChair(230, -170); // Chair next to desk, facing it
          
          createDesk(190, -110, true);
          createChair(190, -90); // Chair next to desk, facing it
          
          createDesk(230, -110, true);
          createChair(230, -90); // Chair next to desk, facing it

          // Office 2 - desk islands (clusters of 4 desks with chairs facing inward)
          // Island 1 - top area
          createDesk(100, 110, true);
          createChair(100, 90); // Chair next to desk, facing it
          
          createDesk(140, 110, true);
          createChair(140, 90); // Chair next to desk, facing it
          
          createDesk(100, 150, true);
          createChair(100, 170); // Chair next to desk, facing it
          
          createDesk(140, 150, true);
          createChair(140, 170); // Chair next to desk, facing it

          // Island 2 - bottom area
          createDesk(190, 110, true);
          createChair(190, 90); // Chair next to desk, facing it
          
          createDesk(230, 110, true);
          createChair(230, 90); // Chair next to desk, facing it
          
          createDesk(190, 150, true);
          createChair(190, 170); // Chair next to desk, facing it
          
          createDesk(230, 150, true);
          createChair(230, 170); // Chair next to desk, facing it

          // Store projected positions for hover detection
          layer.chairProjectedPositions = [];

          // Add raycaster for mouse interaction
          layer.raycaster = new THREE.Raycaster();
          layer.mouse = new THREE.Vector2();

          // Mouse move handler
          const handleMouseMove = (e: MouseEvent) => {
            const canvas = map.getCanvas();
            const rect = canvas.getBoundingClientRect();
            
            // Get mouse position in pixels
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            let hoveredAny = false;

            // Check each chair's projected position
            layer.chairs.forEach((chairGroup: any, index: number) => {
              const projPos = layer.chairProjectedPositions[index];
              if (projPos && projPos.valid) {
                const dx = mouseX - projPos.x;
                const dy = mouseY - projPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Hover threshold in pixels
                const hoverThreshold = 60;
                
                if (distance < hoverThreshold) {
                  if (!chairGroup.isHovered) {
                    chairGroup.isHovered = true;
                    chairGroup.seat.material.color.setHex(layer.hoverChairColor);
                    chairGroup.back.material.color.setHex(layer.hoverChairColor);
                    hoveredAny = true;
                    map.triggerRepaint();
                  }
                } else {
                  if (chairGroup.isHovered) {
                    chairGroup.isHovered = false;
                    chairGroup.seat.material.color.setHex(layer.originalChairColor);
                    chairGroup.back.material.color.setHex(layer.originalChairColor);
                    map.triggerRepaint();
                  }
                }
              }
            });

            canvas.style.cursor = hoveredAny ? 'pointer' : '';
          };

          map.getCanvas().addEventListener('mousemove', handleMouseMove);
          layer.handleMouseMove = handleMouseMove;