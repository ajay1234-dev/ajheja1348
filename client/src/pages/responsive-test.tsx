import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ResponsiveTest() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold">
          Responsive Design Test
        </h1>
        <p className="text-muted-foreground mt-2">
          Testing responsive behavior across different screen sizes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Screen Size Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Current device: {isMobile ? "Mobile" : "Desktop/Tablet"}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This card adapts to different screen sizes using responsive grid
              layouts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="fluid-text">
              This text uses fluid typography that scales smoothly between
              screen sizes.
            </p>
            <h3 className="fluid-heading mt-4">Fluid Heading</h3>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spacing Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-responsive bg-muted rounded-lg">
              <p>
                This container uses responsive padding that adjusts based on
                screen size.
              </p>
            </div>
            <Button className="w-full mt-4">Responsive Button</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grid Layout Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="responsive-grid">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="p-4 bg-muted rounded-lg text-center">
                Grid Item {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flex Layout Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="responsive-flex gap-4">
            <div className="flex-1 p-4 bg-muted rounded-lg text-center">
              Flex Item 1
            </div>
            <div className="flex-1 p-4 bg-muted rounded-lg text-center">
              Flex Item 2
            </div>
            <div className="flex-1 p-4 bg-muted rounded-lg text-center">
              Flex Item 3
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
