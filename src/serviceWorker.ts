interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  // [::1] is the IPv6 localhost address.
  window.location.hostname === '[::1]' ||
  // 127.0.0.0/8 is considered localhost for IPv4.
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/,
  ),
);

export function register(config?: ServiceWorkerConfig): void {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const url = process.env.PUBLIC_URL ? process.env.PUBLIC_URL : '';
    const publicUrl = new URL(url, window.location.href);

    if (publicUrl.origin !== window.location.origin) {
      // The service worker won't work if PUBLIC_URL is on a different origin.
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.ts`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);

        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit http://bit.ly/CRA-PWA',
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: ServiceWorkerConfig): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;

        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'New content is available and will be used when all ' +
                  'tabs for this page are closed. See http://bit.ly/CRA-PWA.',
              );

              config?.onUpdate?.(registration);
            } else {
              console.log('Content is cached for offline use.');

              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch((error: unknown) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(
  swUrl: string,
  config?: ServiceWorkerConfig,
): void {
  fetch(swUrl)
    .then((response) => {
      const contentType = response.headers.get('content-type');

      if (
        response.status === 404 ||
        (contentType != null && !contentType.includes('javascript'))
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        'No internet connection found. App is running in offline mode.',
      );
    });
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
