// The photograph and raster are registered to the same front-facing camera.
export function useFlatScreen({container, canvas, bounds}) {
  const screen = document.createElement('div');
  screen.className = 'flat-picture';
  Object.assign(screen.style, {
    left: bounds.left*100+'%', top: bounds.top*100+'%',
    width: bounds.width*100+'%', height: bounds.height*100+'%'
  });
  screen.append(canvas);
  container.append(screen);
}
