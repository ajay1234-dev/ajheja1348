import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";

export default function ScrollbarDemo() {
  const { toast } = useToast();

  const showSuccess = () => {
    toast({
      title: "Scroll Test Successful",
      description:
        "You can still scroll with mouse wheel, trackpad, and keyboard!",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scrollbar Demo</h1>
          <p className="text-muted-foreground">
            Demo showing hidden scrollbar with full scrolling functionality
          </p>
        </div>
        <Button onClick={showSuccess} className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Test Scrolling
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Default Scrollable Container */}
        <Card>
          <CardHeader>
            <CardTitle>Default Scrollbar (Visible)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-muted/10">
              <div className="space-y-4">
                <p className="text-lg font-medium">
                  This container has visible scrollbars
                </p>
                <div className="space-y-3">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="p-3 bg-background rounded border">
                      <p className="text-sm">Scrollable content item {i + 1}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This demonstrates normal scrolling behavior with visible
                        scrollbar
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              ✓ Mouse wheel works
              <br />
              ✓ Trackpad works
              <br />
              ✓ Touch scroll works
              <br />✓ Keyboard arrows work
            </div>
          </CardContent>
        </Card>

        {/* Hidden Scrollbar Container */}
        <Card>
          <CardHeader>
            <CardTitle>Hidden Scrollbar (Invisible)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto no-scrollbar border rounded-lg p-4 bg-muted/10">
              <div className="space-y-4">
                <p className="text-lg font-medium">
                  This container has hidden scrollbars
                </p>
                <div className="space-y-3">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="p-3 bg-background rounded border">
                      <p className="text-sm">Scrollable content item {i + 1}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scrollbar is invisible but scrolling still works
                        perfectly!
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              ✓ Mouse wheel works
              <br />
              ✓ Trackpad works
              <br />
              ✓ Touch scroll works
              <br />
              ✓ Keyboard arrows work
              <br />✗ Scrollbar is hidden
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">
              1. Apply to Specific Elements
            </h3>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`<div className="h-64 overflow-y-auto no-scrollbar">
  {/* Your scrollable content */}
</div>`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">
              2. Apply Globally to Body (Optional)
            </h3>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`// Add this to your root component or App.tsx
<body className="no-scrollbar">
  {/* Your app content */}
</body>`}</code>
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              ✅ Cross-Browser Support
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>✓ Chrome: WebKit scrollbar hiding</li>
              <li>✓ Safari: WebKit scrollbar hiding</li>
              <li>✓ Edge: WebKit scrollbar hiding</li>
              <li>✓ Firefox: scrollbar-width property</li>
              <li>✓ Mobile browsers: Touch scrolling preserved</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
